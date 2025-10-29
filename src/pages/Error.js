import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useLocation } from "react-router-dom";
export default function Error() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderReference = searchParams.get("orderReference");
    const customerEmail = searchParams.get("customerEmail"); // 👈 récupère email
    const [loading, setLoading] = useState(false);
    const retryPayment = async () => {
        if (!orderReference || !customerEmail) {
            alert("Impossible de relancer le paiement : informations manquantes");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/retry-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderReference,
                    customerEmail, // 👈 envoie au serveur
                }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
            else {
                alert("Impossible de relancer le paiement");
            }
        }
        catch (err) {
            console.error(err);
            alert("Erreur lors de la relance du paiement");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "flex items-center justify-center h-screen bg-red-50", children: _jsxs("div", { className: "bg-white p-10 rounded-xl shadow-lg text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4 font-serif", children: "\u274C Erreur" }), _jsx("p", { className: "text-gray-700 mb-6", children: "Une erreur est survenue lors du paiement de la commande." }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx("button", { onClick: retryPayment, className: "bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50", disabled: loading || !orderReference || !customerEmail, children: loading ? "Patientez..." : "Relancer le paiement" }), _jsx("a", { href: "/", className: "bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition", children: "Retour au panier" })] })] }) }));
}
