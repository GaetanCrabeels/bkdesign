import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

// ⚡ Stockage temporaire en mémoire pour les frais BPOST
// (en prod : stocker ça dans Redis ou une DB)
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
    accountId: process.env.BPOST_ACCOUNT_ID,
    action: "START",
    customerCountry: country || "BE",
    orderReference,
    orderWeight,
  };

  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  // ⚠️ Préparer un slot dans notre mémoire pour récupérer les frais plus tard
  orders[orderReference] = { shippingCost: null };

  res.json(params);
});

// ✅ Confirmation BPOST (appelé par BPOST)
app.post("/bpost/confirm", (req, res) => {
  const { orderReference, deliveryMethodPriceTotal } = req.body;

  console.log("📦 BPOST CONFIRM reçu :", req.body);

  // ⚡ Stocker les frais reçus
  orders[orderReference] = {
    shippingCost: deliveryMethodPriceTotal / 100,
  };

  res.send("OK");
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
    const { items, customerEmail, shippingCost } = req.body;

    const line_items = items.map((item) => {
      const promo = item.variant?.promotion || 0;
      const priceWithPromo = item.price * (1 - promo / 100);
      return {
        price_data: {
          currency: "eur",
          product_data: { name: item.title },
          unit_amount: Math.round(priceWithPromo * 100),
        },
        quantity: item.qty,
      };
    });

    // Ajouter les frais de livraison
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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${process.env.CLIENT_URL}/confirm`,
      cancel_url: `${process.env.CLIENT_URL}/error`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe error:", error);
    res.status(500).json({ error: "Erreur lors de la création de la session Stripe" });
  }
});

/* -------------------------------------------------------------------------- */
/*                              LANCEMENT SERVER                              */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});