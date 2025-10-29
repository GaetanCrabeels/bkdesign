import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function Error() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderReference = searchParams.get("orderReference");

  const [loading, setLoading] = useState(false);

  const retryPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/retry-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference,
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

  return (
    <div className="flex items-center justify-center h-screen bg-red-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Erreur BPOST</h1>
        <p className="text-gray-700 mb-6">
          Une erreur est survenue lors de la création de la commande.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={retryPayment}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50"
            disabled={loading || !orderReference}
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
