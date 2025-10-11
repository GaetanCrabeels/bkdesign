import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// 🧾 Initialisation Express
const app = express();
app.use(cors());
app.use(express.json());

// 💳 Initialisation Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});
/* -------------------------------------------------------------------------- */
/*                               STRIPE CHECKOUT                              */
/* -------------------------------------------------------------------------- */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;

    const line_items = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.title },
        unit_amount: item.price * 100, // montant en centimes
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/confirm`,
      cancel_url: `${process.env.CLIENT_URL}`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: "Erreur lors de la création de la session Stripe, Montant insuffisant" });
  }
});

/* -------------------------------------------------------------------------- */
/*                               BPOST SHIPPING                               */
/* -------------------------------------------------------------------------- */

// 🔐 Génération checksum BPOST
function generateBpostChecksum(params, passphrase) {
  const mandatoryFields = {
    accountId: params.accountId,
    action: "START",
    customerCountry: params.customerCountry,
    orderReference: params.orderReference,
  };

  const concatenated = Object.keys(mandatoryFields)
    .sort() // tri alphabétique
    .map(k => `${k}=${mandatoryFields[k]}`)
    .join("&") + `&${passphrase}`;

  console.log("🔑 BPOST checksum string:", concatenated);

  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

/**
 * Endpoint pour récupérer uniquement les paramètres obligatoires
 */
app.post("/bpost/get-shm-params", (req, res) => {
  const orderReference = Date.now(); // ou générer un ID unique

  const params = {
    accountId: process.env.BPOST_ACCOUNT_ID,
    action: "START",
    customerCountry: "BE",
    orderReference,
  };

  // Calcul du checksum
  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  // Log complet pour debug
  console.log("📦 BPOST params ready to send:", JSON.stringify(params, null, 2));

  res.json(params);
});

// ✅ Confirm
app.post("/bpost/confirm", (req, res) => {
  console.log("✅ BPOST Confirm received:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/confirm`);
});

// ❌ Error
app.post("/bpost/error", (req, res) => {
  console.log("❌ BPOST Error received:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/error`);
});

// ⚠️ Cancel
app.post("/bpost/cancel", (req, res) => {
  console.log("⚠️ BPOST Cancel received:", req.body);
  res.redirect(`${process.env.CLIENT_URL}`);
});

/* -------------------------------------------------------------------------- */
/*                              LANCEMENT SERVER                              */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
