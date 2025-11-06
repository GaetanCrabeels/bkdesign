import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

dotenv.config();
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

const app = express();
app.use(cors());

app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") next();
  else express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// Auto-ping Render
setInterval(async () => {
  try {
    const res = await fetch(`${RENDER_URL}/ping`);
    if (res.ok) console.log("✅ Auto-ping réussi");
  } catch (err) {
    console.error("⚠️ Auto-ping erreur:", err.message);
  }
}, 60 * 1000);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/* ------------------------- BPOST SHIPPING ------------------------- */
function generateBpostChecksum(params, passphrase) {
  console.log("🔹 Génération checksum avec params:", params);
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

  const hash = crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
  console.log("🔹 Checksum généré:", hash);
  return hash;
}

app.post("/bpost/get-shm-params", async (req, res) => {
  console.log("📥 /bpost/get-shm-params appelé avec body:", req.body);
  const { items, country, customerEmail } = req.body;
  const orderReference = Date.now().toString();
  const orderWeight = items.reduce((total, item) => total + (item.variant?.poids || 0) * item.qty, 0);

  const params = {
    accountId: String(process.env.BPOST_ACCOUNT_ID),
    action: "START",
    customerCountry: country || "BE",
    orderReference,
    orderWeight: String(orderWeight),
    extra: orderReference,
  };

  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  const { error } = await supabase.from("orders").insert({
    order_reference: orderReference,
    customer_email: customerEmail,
    items: JSON.stringify(items),
    shipping_cost: null,
    status: "pending",
  });

  if (error) {
    console.error("❌ Erreur création commande:", error);
    return res.status(500).json({ error: "Impossible de créer la commande" });
  }

  console.log("✅ Commande créée avec référence:", orderReference);
  res.json(params);
});

app.all("/bpost/confirm", async (req, res) => {
  console.log("📥 /bpost/confirm appelé avec query/body:", { query: req.query, body: req.body });
  const { orderReference, deliveryMethodPriceTotal, customerEmail } = { ...req.query, ...req.body };

  if (!orderReference || !deliveryMethodPriceTotal) return res.status(400).send("Paramètres manquants");

  const { error } = await supabase
    .from("orders")
    .update({
      shipping_cost: Number(deliveryMethodPriceTotal) / 100,
      customer_email: customerEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("order_reference", orderReference);

  if (error) {
    console.error("❌ Erreur MAJ commande:", error);
    return res.status(500).send("Erreur serveur");
  }

  console.log(`✅ Frais de livraison mis à jour pour la commande ${orderReference}:`, deliveryMethodPriceTotal);
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

app.get("/bpost/get-shipping", async (req, res) => {
  console.log("📥 /bpost/get-shipping appelé avec query:", req.query);
  const { orderReference } = req.query;
  if (!orderReference) return res.status(400).json({ error: "orderReference manquant" });

  const { data, error } = await supabase.from("orders").select("shipping_cost").eq("order_reference", orderReference).single();
  if (error || !data) {
    console.error("❌ Commande introuvable pour get-shipping:", error);
    return res.status(404).json({ message: "Commande introuvable" });
  }
  if (data.shipping_cost === null) return res.status(404).json({ message: "Frais non disponibles" });

  console.log("✅ Shipping cost récupéré:", data.shipping_cost);
  res.json({ shippingCost: data.shipping_cost });
});

/* ------------------------- STRIPE CHECKOUT ------------------------- */
function computeLineItems(items, shippingCost) {
  console.log("🔹 computeLineItems appelé avec items:", items, "et shippingCost:", shippingCost);
  const itemsTotal = items.reduce((acc, item) => acc + item.price * (1 - (item.variant?.promotion || 0) / 100) * item.qty, 0);
  const finalShippingCost = itemsTotal > 75 ? 0 : shippingCost;

  const line_items = items.map(item => {
    const promo = item.variant?.promotion || 0;
    const priceWithPromo = item.price * (1 - promo / 100);
    return {
      price_data: {
        currency: "eur",
        product_data: { name: item.title },
        unit_amount: Math.round(priceWithPromo * 100)
      },
      quantity: item.qty
    };
  });

  if (finalShippingCost > 0) {
    line_items.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Frais de livraison" },
        unit_amount: Math.round(finalShippingCost * 100)
      },
      quantity: 1
    });
  }

  console.log("🔹 Ligne items pour Stripe:", line_items);
  return line_items;
}

app.post("/create-checkout-session", async (req, res) => {
  console.log("📥 /create-checkout-session appelé avec body:", req.body);
  try {
    const { orderReference } = req.body;
    const { data: orderData, error } = await supabase.from("orders").select("*").eq("order_reference", orderReference).single();
    if (error || !orderData) {
      console.error("❌ Commande introuvable pour checkout:", error);
      return res.status(404).json({ error: "Commande introuvable" });
    }

    const items = typeof orderData.items === "string" ? JSON.parse(orderData.items) : orderData.items;
    const shippingCost = orderData.shipping_cost || 0;
    const customerEmail = orderData.customer_email;
    if (!customerEmail) return res.status(400).json({ error: "Email requis" });

    const line_items = computeLineItems(items, shippingCost);

    console.log("🔹 Création session Stripe pour:", orderReference);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      customer_email: customerEmail,
      client_reference_id: orderReference,
      success_url: `${process.env.CLIENT_URL}confirm?orderReference=${orderReference}`,
      cancel_url: `${process.env.CLIENT_URL}error?orderReference=${orderReference}`,
      payment_intent_data: {
        metadata: { bpost_order_reference: orderReference },
        description: `Commande #${orderReference}`
      }
    });

    console.log("✅ Session Stripe créée:", session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    res.status(500).json({ error: "Impossible de créer la session Stripe" });
  }
});

app.post("/retry-checkout", async (req, res) => {
  console.log("📥 /retry-checkout appelé avec body:", req.body);
  try {
    const { orderReference, customerEmail } = req.body;
    if (!orderReference || !customerEmail) return res.status(400).json({ error: "Informations manquantes" });

    const { data: orderData, error } = await supabase.from("orders").select("*").eq("order_reference", orderReference).single();
    if (error || !orderData) return res.status(404).json({ error: "Commande introuvable" });
    if (orderData.status === "paid") return res.status(400).json({ error: "Cette commande est déjà payée" });

    const items = typeof orderData.items === "string" ? JSON.parse(orderData.items) : orderData.items;
    const shippingCost = orderData.shipping_cost || 0;
    const line_items = computeLineItems(items, shippingCost);

    console.log("🔹 Création nouvelle session Stripe pour retry:", orderReference);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: orderReference,
      success_url: `${process.env.CLIENT_URL}confirm?orderReference=${orderReference}&customerEmail=${encodeURIComponent(customerEmail)}`,
      cancel_url: `${process.env.CLIENT_URL}error?orderReference=${orderReference}&customerEmail=${encodeURIComponent(customerEmail)}`,
      payment_intent_data: {
        metadata: { bpost_order_reference: orderReference },
        description: `Commande #${orderReference}`
      }
    });

    console.log("✅ Session Stripe retry créée:", session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Retry checkout error:", err);
    res.status(500).json({ error: "Impossible de relancer le paiement" });
  }
});

/* ------------------------- STRIPE WEBHOOK ------------------------- */
app.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  console.log("📥 /stripe/webhook reçu");
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log("🔹 Webhook Stripe validé, type:", event.type);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderReference = session.client_reference_id;

    console.log("✅ Paiement confirmé pour la commande :", orderReference);

    const { data: orderData, error: orderError } = await supabase.from("orders").select("items").eq("order_reference", orderReference).single();
    if (orderError || !orderData) return res.status(404).send("Commande introuvable");

    const items = typeof orderData.items === "string" ? JSON.parse(orderData.items) : orderData.items;

    for (const item of items) {
      const variantId = item.variant?.id;
      const qty = item.qty;
      if (!variantId || !qty) continue;

      const { data: variant, error: fetchError } = await supabase.from("product_variants").select("quantity").eq("id", variantId).single();
      if (fetchError || !variant) continue;

      const newQty = Math.max(variant.quantity - qty, 0);
      await supabase.from("product_variants").update({ quantity: newQty }).eq("id", variantId);
      console.log(`🔹 Stock mis à jour pour variant ${variantId}: ${variant.quantity} -> ${newQty}`);
    }

    await supabase.from("orders").update({ status: "paid", updated_at: new Date().toISOString() }).eq("order_reference", orderReference);
    console.log(`✅ Commande ${orderReference} marquée comme payée`);
  }

  res.json({ received: true });
});

/* ------------------------- GET ORDER ------------------------- */
app.get("/api/order/:orderReference", async (req, res) => {
  console.log("📥 /api/order/:orderReference appelé avec params:", req.params);
  const { orderReference } = req.params;

  const { data, error } = await supabase.from("orders").select("*").eq("order_reference", orderReference).single();
  if (error || !data) {
    console.error("❌ Commande introuvable:", error);
    return res.status(404).json({ message: "Commande introuvable" });
  }

  const items = typeof data.items === "string" ? JSON.parse(data.items) : data.items;
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingCost = itemsTotal > 75 ? 0 : (data.shipping_cost || 0);
  const total = itemsTotal + shippingCost;

  console.log("🔹 Détails commande récupérés:", { orderReference, itemsTotal, shippingCost, total });
  res.json({
    orderReference: data.order_reference,
    email: data.customer_email,
    items,
    shippingCost,
    total,
    status: data.status,
  });
});

/* ------------------------- LANCEMENT SERVER ------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
