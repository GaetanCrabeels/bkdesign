import express from "express";
import Stripe from "stripe";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

const app = express();
app.use(express.json());

// Map mémoire temporaire pour stocker commandes (remplacer par vraie DB)
const orders = new Map();

// Récupération produit + variantes depuis Supabase
async function getProductWithVariants(productId) {
  const { data: productData } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  const { data: variantData } = await supabase
    .from("product_variants")
    .select("*")
    .eq("produit_id", productId);

  return {
    ...productData,
    variants: variantData || [],
  };
}

// Endpoint création session Stripe
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items, shippingOptionId, customer } = req.body;

    if (!shippingOptionId) return res.status(400).json({ error: "Sélection de livraison requise" });

    const line_items = [];
    let totalCents = 0;

    for (const it of items) {
      const product = await getProductWithVariants(it.id);
      if (!product) return res.status(400).json({ error: `Produit introuvable: ${it.id}` });

      // Variante choisie côté front
      const variant = product.variants.find(v => v.id === it.variantId) || { promotion: 0 };

      const basePrice = Number(product.price || 0);
      const promo = Number(variant.promotion || 0);
      const discountedPrice = basePrice * (1 - promo / 100);
      const unit_amount = Math.round(discountedPrice * 100);

      line_items.push({
        price_data: {
          currency: "eur",
          product_data: { name: product.title, metadata: { productId: product.id, variantId: variant.id } },
          unit_amount,
        },
        quantity: Number(it.qty || 1),
      });

      totalCents += unit_amount * Number(it.qty || 1);
    }

    // Frais de livraison
    const availableOptions = {
      "bpost_standard": 500,
      "bpost_express": 1000,
    };
    const shippingCents = availableOptions[shippingOptionId];
    if (typeof shippingCents === "undefined") return res.status(400).json({ error: "Option livraison invalide" });

    line_items.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Frais de livraison", metadata: { shippingOptionId } },
        unit_amount: shippingCents,
      },
      quantity: 1,
    });
    totalCents += shippingCents;

    if (totalCents < 100) return res.status(400).json({ error: "Montant total trop bas" });

    // Création commande temporaire
    const orderId = crypto.randomUUID();
    orders.set(orderId, {
      id: orderId,
      items,
      line_items,
      shippingOptionId,
      totalCents,
      customer,
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/confirm?orderId=${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout?orderId=${orderId}`,
      metadata: { orderId },
    });

    orders.get(orderId).stripeSessionId = session.id;

    res.json({ url: session.url, orderId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création session Stripe" });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
