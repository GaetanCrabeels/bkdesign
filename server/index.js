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

// 🔍 Middleware global pour journaliser toutes les requêtes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🟢 [${timestamp}] ${req.method} ${req.originalUrl} depuis ${req.ip}`);
  if (req.method !== "GET") {
    console.log("📦 Corps reçu:", JSON.stringify(req.body || {}, null, 2));
  }
  next();
});

// ⚠️ Ne pas utiliser express.json() globalement pour webhook Stripe
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") next();
  else express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// Auto-ping Render pour garder l'app awake
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

app.post("/bpost/get-shm-params", async (req, res) => {
  try {
    console.log("🚚 Requête reçue sur /bpost/get-shm-params :", req.body);
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

    console.log("📦 Tentative d'insertion commande Supabase :", { orderReference, customerEmail });

    const { data, error } = await supabase.from("orders").insert({
      order_reference: orderReference,
      customer_email: customerEmail,
      items: JSON.stringify(items),
      shipping_cost: null,
      status: "pending",
    }).select();

    if (error) {
      console.error("❌ Erreur création commande:", error);
      return res.status(500).json({ error: "Impossible de créer la commande" });
    }

    console.log("✅ Commande enregistrée avec succès :", data);
    res.json(params);
  } catch (err) {
    console.error("🔥 Erreur interne /bpost/get-shm-params :", err);
    res.status(500).json({ error: "Erreur interne serveur" });
  }
});

app.all("/bpost/confirm", async (req, res) => {
  console.log("📬 Confirmation BPOST reçue :", { query: req.query, body: req.body });
  const { orderReference, deliveryMethodPriceTotal, customerEmail } = { ...req.query, ...req.body };

  if (!orderReference || !deliveryMethodPriceTotal) {
    console.error("❌ Paramètres manquants dans /bpost/confirm");
    return res.status(400).send("Paramètres manquants");
  }

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

  console.log(`✅ Commande ${orderReference} mise à jour avec frais de livraison ${deliveryMethodPriceTotal / 100}€`);

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

/* -------------------------------------------------------------------------- */
/*                              STRIPE WEBHOOK LOGS                           */
/* -------------------------------------------------------------------------- */
app.post("/stripe/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  console.log("💳 Webhook Stripe reçu");

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("📨 Événement Stripe :", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderReference = session.client_reference_id;

    console.log("✅ Paiement confirmé pour la commande :", orderReference);

    try {
      const { data: orderData, error: orderError } = await supabase.from("orders").select("items").eq("order_reference", orderReference).single();
      if (orderError || !orderData) {
        console.error("❌ Commande introuvable dans Supabase :", orderReference);
        return res.status(404).send("Commande introuvable");
      }

      const items = typeof orderData.items === "string" ? JSON.parse(orderData.items) : orderData.items;
      for (const item of items) {
        const variantId = item.variant?.id;
        const qty = item.qty;
        if (!variantId || !qty) continue;

        const { data: variant, error: fetchError } = await supabase.from("product_variants").select("quantity").eq("id", variantId).single();
        if (fetchError || !variant) continue;

        const newQty = Math.max(variant.quantity - qty, 0);
        await supabase.from("product_variants").update({ quantity: newQty }).eq("id", variantId);
        console.log(`🛠️ Stock mis à jour pour variant ${variantId} : -${qty}, nouveau stock = ${newQty}`);
      }

      await supabase.from("orders").update({ status: "paid", updated_at: new Date().toISOString() }).eq("order_reference", orderReference);
      console.log("💾 Statut commande mis à jour : paid");
    } catch (err) {
      console.error("🔥 Erreur traitement Stripe Webhook :", err);
    }
  }

  res.json({ received: true });
});

/* -------------------------------------------------------------------------- */
/*                              LANCEMENT SERVER                              */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
