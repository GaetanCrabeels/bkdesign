import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
export default function Error() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderReference = searchParams.get("orderReference");
    const customerEmail = searchParams.get("customerEmail");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 👈 état du statut
    const [checking, setChecking] = useState(true);
    // 🔹 Vérifie le statut de la commande sur le serveur
    useEffect(() => {
        if (!orderReference)
            return;
        const fetchStatus = async () => {
            try {
                const res = await fetch(`https://bkdesign.onrender.com/api/order/${orderReference}`);
                if (!res.ok)
                    throw new globalThis.Error("Commande introuvable");
                const data = await res.json();
                setStatus(data.status || "unknown");
            }
            catch (err) {
                console.error("Erreur récupération statut commande :", err);
                setStatus("unknown");
            }
            finally {
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
    if (checking) {
        return _jsx("p", { className: "text-center mt-10", children: "V\u00E9rification de la commande..." });
    }
    // ✅ Commande déjà payée
    if (status === "paid") {
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-green-50", children: _jsxs("div", { className: "bg-white p-10 rounded-xl shadow-lg text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-green-600 mb-4 font-serif", children: "\u2705 Commande d\u00E9j\u00E0 pay\u00E9e" }), _jsx("p", { className: "text-gray-700 mb-6", children: "Cette commande a d\u00E9j\u00E0 \u00E9t\u00E9 r\u00E9gl\u00E9e avec succ\u00E8s." }), _jsx("a", { href: "/", className: "bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition", children: "Retour \u00E0 l\u2019accueil" })] }) }));
    }
    // ❌ Commande non payée ou erreur de paiement
    return (_jsx("div", { className: "flex items-center justify-center h-screen bg-red-50", children: _jsxs("div", { className: "bg-white p-10 rounded-xl shadow-lg text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4 font-serif", children: "\u274C Erreur" }), _jsx("p", { className: "text-gray-700 mb-6", children: "Une erreur est survenue lors du paiement de la commande." }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx("button", { onClick: retryPayment, className: "bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50", disabled: loading || !orderReference || !customerEmail, children: loading ? "Patientez..." : "Relancer le paiement" }), _jsx("a", { href: "/", className: "bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition", children: "Retour au panier" })] })] }) }));
}
