import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());

// ⚠️ On ne met pas express.json() ici globalement pour ne pas casser la vérification Stripe
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// 🔐 Connexion à Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ⚡ Stockage temporaire en mémoire pour les frais BPOST et les items
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
  if (params.deliveryMethodsOverrides) fieldsToInclude.deliveryMethodsOverrides = params.deliveryMethodsOverrides;
  if (params.extraSecure) fieldsToInclude.extraSecure = params.extraSecure;

  const concatenated =
    Object.keys(fieldsToInclude)
      .sort()
      .map((k) => `${k}=${fieldsToInclude[k]}`)
      .join("&") + `&${passphrase}`;

  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

// ✅ Récupération des params pour popup BPOST
app.post("/bpost/get-shm-params", (req, res) => {
  const { items, country } = req.body;

  const orderReference = Date.now(); // ou un UUID
  const orderWeight = items.reduce((total, item) => {
    const weight = item.variant?.poids || 0;
    return total + weight * item.qty;
  }, 0);

  const params = {
    accountId: String(process.env.BPOST_ACCOUNT_ID),
    action: "START",
    customerCountry: String(country || "BE"),
    orderReference: String(orderReference),
    orderWeight: String(orderWeight),
    extra: String(orderReference),
  };

  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  // ⚠️ Préparer un slot dans notre mémoire pour récupérer les frais et items plus tard
  orders[orderReference] = { shippingCost: null, items };

  res.json(params);
});

// ✅ Confirmation BPOST (appelé par BPOST)
app.all("/bpost/confirm", (req, res) => {
  const { orderReference, deliveryMethodPriceTotal } = {
    ...req.query,
    ...req.body,
  };

  console.log("📦 BPOST Confirm reçu :", req.query, req.body);

  if (!orderReference || !deliveryMethodPriceTotal) {
    console.error("❌ Paramètres manquants dans la confirmation BPOST");
    return res.status(400).send("Paramètres manquants");
  }

  // ✅ Stocker les frais en euros
  if (!orders[orderReference]) orders[orderReference] = {};
  orders[orderReference].shippingCost = Number(deliveryMethodPriceTotal) / 100;

  res.send(`
    <html>
      <head><title>Livraison confirmée</title></head>
      <body style="font-family: sans-serif; text-align:center; padding-top: 40px;">
        <h2>✅ Livraison BPOST confirmée</h2>
        <p>Vous pouvez maintenant fermer cette fenêtre et procéder au paiement.</p>
        <script>
          window.close();
        </script>
      </body>
    </html>
  `);
});

// ✅ Endpoint pour récupérer les frais stockés depuis le front
app.get("/bpost/get-shipping", (req, res) => {
  const { orderReference } = req.query;
  const order = orders[orderReference];

  if (!order || order.shippingCost === null) {
    return res.status(404).json({ message: "Frais non encore disponibles" });
  }

  res.json(order);
});

/* -------------------------------------------------------------------------- */
/*                               STRIPE CHECKOUT                              */
/* -------------------------------------------------------------------------- */

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, customerEmail, shippingCost, orderReference } = req.body;

    const line_items = items.map((item) => {
      const promo = item.variant?.promotion || 0;
      const priceWithPromo = item.price * (1 - promo / 100);
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(priceWithPromo * 100),
        },
        quantity: item.qty,
      };
    });

    if (shippingCost > 0) {
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Frais de livraison" },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // 🪄 Stocker les items en mémoire pour décrémenter plus tard
    orders[orderReference] = { ...orders[orderReference], items };

    // 🪄 Création de la session Stripe avec la même référence
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: String(orderReference),
      success_url: `${process.env.CLIENT_URL}/confirm`,
      cancel_url: `${process.env.CLIENT_URL}/error`,
      payment_intent_data: {
        metadata: {
          bpost_order_reference: String(orderReference),
        },
        description: `Commande #${orderReference}`,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: "Erreur lors de la création de la session Stripe" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               STRIPE WEBHOOK                               */
/* -------------------------------------------------------------------------- */


app.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Signature Stripe invalide :", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderReference = session.client_reference_id;

      console.log("✅ Paiement confirmé pour la commande :", orderReference);

      const order = orders[orderReference];

      if (order && order.items) {
        for (const item of order.items) {
          const variantId = item.variant?.id;
          const qty = item.qty;

          if (variantId && qty) {
            // 1️⃣ Récupérer la quantité actuelle
            const { data: variant, error: fetchError } = await supabase
              .from("product_variants")
              .select("quantity")
              .eq("id", variantId)
              .single();

            if (fetchError || !variant) {
              console.error(`❌ Impossible de récupérer ${item.title}`, fetchError);
              continue;
            }

            // 2️⃣ Calculer la nouvelle quantité
            const newQty = Math.max(variant.quantity - qty, 0);

            // 3️⃣ Mettre à jour la DB
            const { error: updateError } = await supabase
              .from("product_variants")
              .update({ quantity: newQty })
              .eq("id", variantId);

            if (updateError) {
              console.error(`❌ Erreur MAJ stock pour ${item.title}`, updateError);
            } else {
              console.log(`📉 Stock mis à jour pour ${item.title} (-${qty})`);
            }
          }
        }
      } else {
        console.warn(`⚠️ Aucun item trouvé pour la commande ${orderReference}`);
      }
    }

    res.json({ received: true });
  }
);


/* -------------------------------------------------------------------------- */
/*                              LANCEMENT SERVER                              */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
