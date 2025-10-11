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
    const { items, customerEmail } = req.body;

    const line_items = items.map((item) => {
      // Prix avec promo
      const promotion = item.variant?.promotion || 0;
      const priceWithPromo = item.price * (1 - promotion / 100);

      return {
        price_data: {
          currency: "eur",
          product_data: { name: item.title },
          unit_amount: Math.round(priceWithPromo * 100), // ⚡ en centimes
        },
        quantity: item.qty,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail, // Stripe envoie un mail automatique
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
/*                               BPOST SHIPPING                               */
/* -------------------------------------------------------------------------- */

// 🔐 Génération checksum BPOST

/**
 * Endpoint pour récupérer uniquement les paramètres obligatoires
 */
app.post("/bpost/get-shm-params", (req, res) => {
  const { items, costCenter } = req.body; // costCenter est optionnel

  const orderReference = Date.now(); // ou un ID unique

  // Calcul du poids total en grammes
  const orderWeight = items.reduce((total, item) => {
    const itemWeight = item.variant?.poids || 0;
    return total + itemWeight * item.qty;
  }, 0);

  // Préparer les paramètres BPOST
  const params = {
    accountId: process.env.BPOST_ACCOUNT_ID,
    action: "START",
    customerCountry: "EU",
    orderReference,
    orderWeight, // ajout du poids
  };

  // Optionnel : costCenter
  if (costCenter) {
    params.costCenter = costCenter;
  }

  // 🔑 Calcul checksum en incluant les champs optionnels
  function generateBpostChecksum(params, passphrase) {
    const fieldsToInclude = {
      accountId: params.accountId,
      action: params.action,
      customerCountry: params.customerCountry,
      orderReference: params.orderReference,
    };

    // Ajouter les champs optionnels s'ils existent
    if (params.costCenter) fieldsToInclude.costCenter = params.costCenter;
    if (params.orderWeight) fieldsToInclude.orderWeight = params.orderWeight;
    if (params.deliveryMethodsOverrides) fieldsToInclude.deliveryMethodsOverrides = params.deliveryMethodsOverrides;
    if (params.extraSecure) fieldsToInclude.extraSecure = params.extraSecure;

    // Tri alphabétique + concaténation + passphrase
    const concatenated = Object.keys(fieldsToInclude)
      .sort()
      .map(k => `${k}=${fieldsToInclude[k]}`)
      .join("&") + `&${passphrase}`;

    console.log("🔑 BPOST checksum string:", concatenated);

    return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
  }

  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

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
