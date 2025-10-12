import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ important pour POST form urlencoded

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
    accountId: String(process.env.BPOST_ACCOUNT_ID),
    action: "START",
    customerCountry: String(country || "BE"),
    orderReference: String(orderReference),
    orderWeight: String(orderWeight),
    extra: String(orderReference)
  };


  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  // ⚠️ Préparer un slot dans notre mémoire pour récupérer les frais plus tard
  orders[orderReference] = { shippingCost: null };

  res.json(params);
});

// ✅ Confirmation BPOST (appelé par BPOST)
app.all("/bpost/confirm", (req, res) => {
  // BPOST peut envoyer en GET ou POST
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
  orders[orderReference] = {
    shippingCost: Number(deliveryMethodPriceTotal) / 100,
  };

  // ✅ Retourner une simple page pour la popup
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

    // 🪄 Création de la session Stripe avec la même référence
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: String(orderReference),
      success_url: `${process.env.CLIENT_URL}/confirm`,
      cancel_url: `${process.env.CLIENT_URL}/error`,
    });

    // 🪙 Ajouter metadata sur le PaymentIntent pour la traçabilité
    if (session.payment_intent) {
      await stripe.paymentIntents.update(session.payment_intent, {
        metadata: {
          bpost_order_reference: String(orderReference),
        },
        description: `Commande #${orderReference}`,
      });
    }

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
