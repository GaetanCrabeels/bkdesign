import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
export default function Error() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderReference = searchParams.get("orderReference");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [checking, setChecking] = useState(true);
    const [customerEmail, setCustomerEmail] = useState(null);
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
                setCustomerEmail(data.email || null); // récupère l’email depuis la commande
            }
            catch (err) {
                console.error("Erreur récupération commande :", err);
                setStatus("unknown");
            }
            finally {
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
            if (data.url)
                window.location.href = data.url;
            else
                alert("Impossible de relancer le paiement");
        }
        catch (err) {
            console.error(err);
            alert("Erreur lors de la relance du paiement");
        }
        finally {
            setLoading(false);
        }
    };
    if (checking)
        return _jsx("p", { className: "text-center mt-10", children: "V\u00E9rification de la commande..." });
    // ✅ Commande déjà payée
    if (status === "paid") {
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-green-50", children: _jsxs("div", { className: "bg-white p-10 rounded-xl shadow-lg text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-green-600 mb-4 font-serif", children: "\u2705 Commande d\u00E9j\u00E0 pay\u00E9e" }), _jsx("p", { className: "text-gray-700 mb-6", children: "Cette commande a d\u00E9j\u00E0 \u00E9t\u00E9 r\u00E9gl\u00E9e avec succ\u00E8s." }), _jsx("a", { href: "/e-shop", className: "bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition", children: "Retour \u00E0 l\u2019accueil" })] }) }));
    }
    // ❌ Commande non payée ou introuvable
    const getButtonText = () => {
        if (loading)
            return "Patientez...";
        if (status === "pending")
            return "Relancer le paiement";
        if (status === "paid")
            return "Commande déjà payée";
        if (status === "no-ref")
            return "Pas de référence de commande";
        if (status === "not-found")
            return "Commande introuvable";
        return "Erreur inconnue";
    };
    return (_jsx("div", { className: "flex items-center justify-center h-screen bg-red-50", children: _jsxs("div", { className: "bg-white p-10 rounded-xl shadow-lg text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4 font-serif", children: "\u274C Erreur" }), _jsx("p", { className: "text-gray-700 mb-6", children: "Une erreur est survenue lors du paiement de la commande ou la commande n'existe pas." }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx("button", { onClick: retryPayment, disabled: status !== "pending" || loading || !customerEmail, className: `px-6 py-2 rounded transition 
              ${status === "pending" && !loading ? "bg-gray-600 text-white hover:bg-gray-700 cursor-pointer" : "bg-gray-300 text-gray-600 cursor-not-allowed"}
              ${loading ? "bg-gray-400 text-gray-200 cursor-wait" : ""}
            `, children: getButtonText() }), _jsx("a", { href: "/e-shop", className: "bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition", children: "Retour au panier" })] })] }) }));
}
