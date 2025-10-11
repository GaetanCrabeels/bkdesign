import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

/* -------------------------------------------------------------------------- */
/*                        Génération checksum BPOST                            */
/* -------------------------------------------------------------------------- */
function generateBpostChecksum(params, passphrase) {
  const mandatoryFields = {
    accountId: params.accountId,
    action: params.action,
    customerCountry: params.customerCountry,
    orderReference: params.orderReference,
  };

  const concatenated = Object.keys(mandatoryFields)
    .sort()
    .map(k => `${k}=${mandatoryFields[k]}`)
    .join("&") + `&${passphrase}`;

  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

/* -------------------------------------------------------------------------- */
/*                     Endpoint pour BPOST Shipping Manager                  */
/* -------------------------------------------------------------------------- */
app.post("/bpost/get-shm-params", (req, res) => {
  const { items, customer } = req.body;

  const orderReference = Date.now().toString(); // ID unique

  // Calcul du poids total en grammes
  const totalWeightGrams = items.reduce((sum, item) => {
    return sum + item.variant.poids * item.qty;
  }, 0);

  // On peut stocker basketTotal et un tempId dans extra pour récupérer le prix
  const basketTotal = items.reduce((sum, item) => sum + item.price * item.qty * 100, 0); // en centimes

  const params = {
    accountId: process.env.BPOST_ACCOUNT_ID,
    action: "START",
    customerCountry: "BE",
    orderReference,
    orderWeight: totalWeightGrams.toString(), // poids en grammes

    extra: JSON.stringify({
      basketTotal,       // Total panier en centimes
      tempId: orderReference,
    }),
    lang: "FR",
  };

  // Calcul checksum
  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  res.json(params);
});

/* -------------------------------------------------------------------------- */
/*               Endpoint pour la confirmation BPOST (iFrame)                 */
/* -------------------------------------------------------------------------- */
app.post("/bpost/confirm", async (req, res) => {
  try {
    // BPOST renvoie extra avec les infos de livraison calculées
    const extraData = JSON.parse(req.body.extra || "{}");
    const shippingCost = parseInt(extraData.shippingCost || "0"); // en centimes
    const basketTotal = parseInt(extraData.basketTotal || "0");   // en centimes

    let finalAmount = basketTotal + shippingCost;

    // Si total > 100€, on ignore les frais de livraison
    if (finalAmount > 10000) finalAmount = basketTotal;

    // Création de la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Commande" },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/confirm`,
      cancel_url: `${process.env.CLIENT_URL}/error`,
    });

    // Redirection vers Stripe Checkout
    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la session Stripe:", error);
    res.status(500).json({ error: "Erreur lors de la finalisation du paiement" });
  }
});

/* -------------------------------------------------------------------------- */
/*                              Lancement du serveur                           */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
