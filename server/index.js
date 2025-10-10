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

app.listen(4242, () => console.log("✅ Serveur démarré sur port 4242"));
