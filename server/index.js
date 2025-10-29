import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch"; // npm install node-fetch

dotenv.config();
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

const app = express();
app.use(cors());

// ⚠️ On ne met pas express.json() globalement pour ne pas casser Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Auto-ping Render pour garder l'app awake
setInterval(async () => {
  try {
    const res = await fetch(`${RENDER_URL}/ping`);
    if (res.ok) console.log("✅ Auto-ping réussi");
  } catch (err) {
    console.error("⚠️ Auto-ping erreur:", err.message);
  }
}, 60 * 1000);

app.use(express.urlencoded({ extended: true }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Stockage temporaire des commandes
const orders = {};

/* -------------------------------------------------------------------------- */
/*                               BPOST SHIPPING                               */
/* -------------------------------------------------------------------------- */
function generateBpostChecksum(params, passphrase) {
  const fieldsToInclude = {
    accountId: params.accountId,
    action: "START",
    customerCountry: params.customerCountry,
    orderReference: params.orderReference,
  };

  if (params.costCenter) fieldsToInclude.costCenter = params.costCenter;
  if (params.orderWeight) fieldsToInclude.orderWeight = params.orderWeight;
  if (params.deliveryMethodsOverrides)
    fieldsToInclude.deliveryMethodsOverrides = params.deliveryMethodsOverrides;
  if (params.extraSecure) fieldsToInclude.extraSecure = params.extraSecure;

  const concatenated =
    Object.keys(fieldsToInclude)
      .sort()
      .map((k) => `${k}=${fieldsToInclude[k]}`)
      .join("&") + `&${passphrase}`;

  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

// Récupération des params pour popup BPOST
app.post("/bpost/get-shm-params", (req, res) => {
  const { items, country, customerEmail } = req.body;
  const orderReference = Date.now().toString();
  const orderWeight = items.reduce((total, item) => {
    const weight = item.variant?.poids || 0;
    return total + weight * item.qty;
  }, 0);

  const params = {
    accountId: String(process.env.BPOST_ACCOUNT_ID),
    action: "START",
    customerCountry: country || "BE",
    orderReference: orderReference,
    orderWeight: String(orderWeight),
    extra: orderReference,
  };

  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  orders[orderReference] = { shippingCost: null, items, customerEmail };

  res.json(params);
});

// Confirmation BPOST
app.all("/bpost/confirm", (req, res) => {
  const { orderReference, deliveryMethodPriceTotal } = { ...req.query, ...req.body };
  if (!orderReference || !deliveryMethodPriceTotal) return res.status(400).send("Paramètres manquants");

  if (!orders[orderReference]) orders[orderReference] = { shippingCost: null, items: [] };
  orders[orderReference].shippingCost = Number(deliveryMethodPriceTotal) / 100;

  res.send(`
    <html>
      <head><title>Livraison confirmée</title></head>
      <body style="font-family: sans-serif; text-align:center; padding-top: 40px;">
        <h2>✅ Livraison BPOST confirmée</h2>
        <p>Vous pouvez maintenant fermer cette fenêtre et procéder au paiement.</p>
        <script>window.close();</script>
      </body>
    </html>
  `);
});

// Endpoint pour récupérer les frais
app.get("/bpost/get-shipping", (req, res) => {
  const { orderReference } = req.query;
  const order = orders[orderReference];
  if (!order || order.shippingCost === null) return res.status(404).json({ message: "Frais non disponibles" });
  res.json(order);
});

/* -------------------------------------------------------------------------- */
/*                                    Ping                                    */
/* -------------------------------------------------------------------------- */
app.get("/ping", (req, res) => res.json({ status: "alive", timestamp: Date.now() }));

/* -------------------------------------------------------------------------- */
/*                               STRIPE CHECKOUT                              */
/* -------------------------------------------------------------------------- */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, shippingCost, orderReference } = req.body;

    if (!orderReference || !orders[orderReference]) {
      return res.status(400).json({ error: "Commande introuvable" });
    }

    // ⚠️ Récupérer l'email stocké dans l'objet order (provenant de BPOST)
    const customerEmail = orders[orderReference].customerEmail;
    if (!customerEmail) return res.status(400).json({ error: "Email requis" });

    const line_items = items.map(item => {
      const promo = item.variant?.promotion || 0;
      const priceWithPromo = item.price * (1 - promo / 100);
      return {
        price_data: {
          currency: "eur",
          product_data: { name: item.title },
          unit_amount: Math.round(priceWithPromo * 100)
        },
        quantity: item.qty,
      };
    });

    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de livraison" },
          unit_amount: Math.round(shippingCost * 100)
        },
        quantity: 1,
      });
    }

    // ⚡ Création de la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: orderReference,
      success_url: `${process.env.CLIENT_URL}confirm?orderReference=${orderReference}`,
      cancel_url: `${process.env.CLIENT_URL}error?orderReference=${orderReference}`,
      payment_intent_data: {
        metadata: { bpost_order_reference: orderReference },
        description: `Commande #${orderReference}`,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err);
    res.status(500).json({ error: "Erreur création session Stripe" });
  }
});


// Relancer le paiement
app.post("/retry-checkout", async (req, res) => {
  try {
    const { orderReference, customerEmail } = req.body;
    const order = orders[orderReference];
    if (!order || !order.items || !customerEmail) return res.status(404).json({ error: "Commande introuvable" });

    const line_items = order.items.map(item => {
      const promo = item.variant?.promotion || 0;
      const priceWithPromo = item.price * (1 - promo / 100);
      return {
        price_data: { currency: "eur", product_data: { name: item.title }, unit_amount: Math.round(priceWithPromo * 100) },
        quantity: item.qty,
      };
    });

    if (order.shippingCost > 0) {
      line_items.push({
        price_data: { currency: "eur", product_data: { name: "Frais de livraison" }, unit_amount: Math.round(order.shippingCost * 100) },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: orderReference,
      success_url: `${process.env.CLIENT_URL}confirm?orderReference=${orderReference}&customerEmail=${encodeURIComponent(customerEmail)}`,
      cancel_url: `${process.env.CLIENT_URL}error?orderReference=${orderReference}&customerEmail=${encodeURIComponent(customerEmail)}`,
      payment_intent_data: { metadata: { bpost_order_reference: orderReference }, description: `Commande #${orderReference}` },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Retry checkout error:", err);
    res.status(500).json({ error: "Impossible de relancer le paiement" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               STRIPE WEBHOOK                               */
/* -------------------------------------------------------------------------- */
app.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderReference = session.client_reference_id;
    const order = orders[orderReference];

    console.log("✅ Paiement confirmé pour la commande :", orderReference);

    if (order && order.items) {
      for (const item of order.items) {
        const variantId = item.variant?.id;
        const qty = item.qty;
        if (!variantId || !qty) continue;

        const { data: variant, error: fetchError } = await supabase
          .from("product_variants")
          .select("quantity")
          .eq("id", variantId)
          .single();

        if (fetchError || !variant) { console.error(`❌ Impossible de récupérer ${item.title}`, fetchError); continue; }

        const newQty = Math.max(variant.quantity - qty, 0);

        const { error: updateError } = await supabase
          .from("product_variants")
          .update({ quantity: newQty })
          .eq("id", variantId);

        if (updateError) console.error(`❌ Erreur MAJ stock pour ${item.title}`, updateError);
        else console.log(`📉 Stock mis à jour pour ${item.title} (-${qty})(${variantId})`);
      }
    } else {
      console.warn(`⚠️ Aucun item trouvé pour la commande ${orderReference}`);
    }
  }

  res.json({ received: true });
});

/* -------------------------------------------------------------------------- */
/*                              LANCEMENT SERVER                              */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
