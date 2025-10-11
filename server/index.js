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

  const concatenated = Object.keys(fieldsToInclude)
    .sort()
    .map(k => `${k}=${fieldsToInclude[k]}`)
    .join("&") + `&${passphrase}`;

  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

// 🔹 Endpoint pour BPOST : récupérer les paramètres pour le popup
app.post("/bpost/get-shm-params", (req, res) => {
  const { items, country } = req.body;

  const orderReference = Date.now(); // ou générer un ID unique
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
    // ⚡ Ici tu peux éventuellement ajouter costCenter ou extraSecure
  };

  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  res.json(params);
});

// 🔹 Endpoint pour recevoir la confirmation BPOST et frais de livraison
app.post("/bpost/confirm", (req, res) => {
  const { deliveryMethodPriceTotal } = req.body;
  res.json({
    shippingCost: deliveryMethodPriceTotal ? deliveryMethodPriceTotal / 100 : 0
  });
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

    // ⚡ Ajouter les frais de livraison comme un article
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
      cancel_url: `${process.env.CLIENT_URL}`,
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
