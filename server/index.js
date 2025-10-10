const express = require("express");
const Stripe = require("stripe");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// === STRIPE SETUP ===
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// === ORDER STORAGE ===
// ⚠️ En production, stocke dans une vraie base (Postgres, MongoDB...)
const orders = [];

// === CREATE CHECKOUT SESSION ===
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: "Panier vide" });

    const orderId = Date.now().toString();
    orders.push({ id: orderId, items, status: "pending" });

    const line_items = items.map(item => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.title },
        unit_amount: item.price * 100,
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success?orderId=${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel?orderId=${orderId}`,
      metadata: { orderId },
    });

    res.json({ url: session.url, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// === STRIPE WEBHOOK ===
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata.orderId;
      const order = orders.find(o => o.id === orderId);
      if (order) order.status = "paid";
      console.log(`✅ Order ${orderId} marked as paid`);
    }

    res.json({ received: true });
  }
);

// === BPOST ===
function generateBpostChecksum(params, passphrase) {
  const mandatoryFields = {
    accountId: params.accountId,
    action: "START",
    customerCountry: params.customerCountry,
    orderReference: params.orderReference,
  };

  const concatenated =
    Object.keys(mandatoryFields)
      .sort()
      .map(k => `${k}=${mandatoryFields[k]}`)
      .join("&") + `&${passphrase}`;

  return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
}

// Endpoint sécurisé : ne génère étiquette que si paiement OK
app.post("/bpost/get-shm-params", (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: "Commande non trouvée" });
  if (order.status !== "paid") return res.status(403).json({ error: "Commande non payée" });

  const orderReference = order.id;
  const params = {
    accountId: process.env.BPOST_ACCOUNT_ID || "042599",
    action: "START",
    customerCountry: "BE",
    orderReference,
  };
  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE);

  res.json(params);
});

// === BPOST REDIRECTION ===
app.post("/bpost/confirm", (req, res) => {
  console.log("✅ BPOST Confirm:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/confirm`);
});
app.post("/bpost/error", (req, res) => {
  console.log("❌ BPOST Error:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/error`);
});
app.post("/bpost/cancel", (req, res) => {
  console.log("⚠️ BPOST Cancel:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/cancel`);
});

// === START SERVER ===
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
