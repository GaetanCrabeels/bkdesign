import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Error() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderReference = searchParams.get("orderReference");
  const customerEmail = searchParams.get("customerEmail");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null); // 👈 état du statut
  const [checking, setChecking] = useState(true);

  // 🔹 Vérifie le statut de la commande sur le serveur
  useEffect(() => {
    if (!orderReference) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`https://bkdesign.onrender.com/api/order/${orderReference}`);
        if (!res.ok) throw new globalThis.Error("Commande introuvable");

        const data = await res.json();
        setStatus(data.status || "unknown");
      } catch (err) {
        console.error("Erreur récupération statut commande :", err);
        setStatus("unknown");
      } finally {
        setChecking(false);
      }
    };

    fetchStatus();
  }, [orderReference]);

  const retryPayment = async () => {
    if (!orderReference || !customerEmail) {
      alert("Impossible de relancer le paiement : informations manquantes");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://bkdesign.onrender.com/retry-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference,
          customerEmail,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Impossible de relancer le paiement");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la relance du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <p className="text-center mt-10">Vérification de la commande...</p>;
  }

  // ✅ Commande déjà payée
  if (status === "paid") {
    return (
      <div className="flex items-center justify-center h-screen bg-green-50">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4 font-serif">✅ Commande déjà payée</h1>
          <p className="text-gray-700 mb-6">
            Cette commande a déjà été réglée avec succès.
          </p>
          <a
            href="/"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Retour à l’accueil
          </a>
        </div>
      </div>
    );
  }

  // ❌ Commande non payée ou erreur de paiement
  return (
    <div className="flex items-center justify-center h-screen bg-red-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">❌ Erreur</h1>
        <p className="text-gray-700 mb-6">
          Une erreur est survenue lors du paiement de la commande.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={retryPayment}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50"
            disabled={loading || !orderReference || !customerEmail}
          >
            {loading ? "Patientez..." : "Relancer le paiement"}
          </button>
          <a
            href="/"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            Retour au panier
          </a>
        </div>
      </div>
    </div>
  );
}
