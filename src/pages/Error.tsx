import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Error() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderReference = searchParams.get("orderReference");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  // 🔹 Vérifie le statut de la commande
  useEffect(() => {
    if (!orderReference) {
      setStatus("no-ref");
      setChecking(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`https://bkdesign.onrender.com/api/order/${orderReference}`);
        if (!res.ok) {
          setStatus(res.status === 404 ? "not-found" : "unknown");
          return;
        }

        const data = await res.json();
        setStatus((data.status || "unknown").trim().toLowerCase());
        setCustomerEmail(data.email  || null); // récupère l’email depuis la commande
      } catch (err) {
        console.error("Erreur récupération commande :", err);
        setStatus("unknown");
      } finally {
        setChecking(false);
      }
    };

    fetchOrder();
  }, [orderReference]);

  // 🔹 Relance du paiement
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
        body: JSON.stringify({ orderReference, customerEmail }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Impossible de relancer le paiement");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la relance du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <p className="text-center mt-10">Vérification de la commande...</p>;

  // ✅ Commande déjà payée
  if (status === "paid") {
    return (
      <div className="flex items-center justify-center h-screen bg-green-50">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4 font-serif">
            ✅ Commande déjà payée
          </h1>
          <p className="text-gray-700 mb-6">Cette commande a déjà été réglée avec succès.</p>
          <a
            href="/e-shop"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Retour à l’accueil
          </a>
        </div>
      </div>
    );
  }

  // ❌ Commande non payée ou introuvable
  const getButtonText = () => {
    if (loading) return "Patientez...";
    if (status === "pending") return "Relancer le paiement";
    if (status === "paid") return "Commande déjà payée";
    if (status === "no-ref") return "Pas de référence de commande";
    if (status === "not-found") return "Commande introuvable";
    return "Erreur inconnue";
  };

  return (
    <div className="flex items-center justify-center h-screen bg-red-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4 font-serif">❌ Erreur</h1>
        <p className="text-gray-700 mb-6">
          Une erreur est survenue lors du paiement de la commande ou la commande n'existe pas.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={retryPayment}
            disabled={status !== "pending" || loading || !customerEmail}
            className={`px-6 py-2 rounded transition 
              ${status === "pending" && !loading ? "bg-gray-600 text-white hover:bg-gray-700 cursor-pointer" : "bg-gray-300 text-gray-600 cursor-not-allowed"}
              ${loading ? "bg-gray-400 text-gray-200 cursor-wait" : ""}
            `}
          >
            {getButtonText()}
          </button>
          <a
            href="/e-shop"
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            Retour au panier
          </a>
        </div>
      </div>
    </div>
  );
}
