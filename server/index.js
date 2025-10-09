import express from "express";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Génère le checksum BPOST uniquement avec les champs obligatoires
 */
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
    accountId: "042599",
    action: "START",
    customerCountry: "BE",
    orderReference,
  };

  // Calcul du checksum
  params.checksum = generateBpostChecksum(params, process.env.BPOST_PASSPHRASE || "cafe7283dc");

  console.log("📦 BPOST params ready to send:", JSON.stringify(params, null, 2));

  res.json(params);
});

/**
 * 🔹 Endpoint BPOST Confirm
 * Redirige vers la page React /confirm
 */
app.post("/bpost/confirm", (req, res) => {
  const params = req.body;
  console.log("✅ BPOST Confirm received:", params);

  // Redirection vers React front
  res.redirect(`${process.env.CLIENT_URL}/confirm`);
});

/**
 * 🔹 Endpoint BPOST Error
 * Redirige vers la page React /error
 */
app.post("/bpost/error", (req, res) => {
  const params = req.body;
  console.log("❌ BPOST Error received:", params);

  res.redirect(`${process.env.CLIENT_URL}/error`);
});

/**
 * 🔹 Endpoint BPOST Cancel
 * Redirige vers la page React /cancel
 */
app.post("/bpost/cancel", (req, res) => {
  const params = req.body;
  console.log("⚠️ BPOST Cancel received:", params);

  res.redirect(`${process.env.CLIENT_URL}/cancel`);
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`✅ Serveur démarré sur port ${PORT}`));
