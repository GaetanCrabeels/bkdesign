import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useCartContext } from "../components/CartContext";
import { useLocation } from "react-router-dom";
export default function Confirm() {
    const { clearLocalCart } = useCartContext();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const orderReference = searchParams.get("orderReference");
    useEffect(() => {
        clearLocalCart?.();
    }, []);
    useEffect(() => {
        if (!orderReference) {
            setLoading(false);
            return;
        }
        const fetchOrder = async () => {
            try {
                const res = await fetch(`https://bkdesign.onrender.com/api/order/${orderReference}`);
                if (!res.ok)
                    throw new Error("Commande introuvable");
                const data = await res.json();
                // ⚠️ Typage explicite pour reduce
                const totalItems = data.items.reduce((acc, i) => {
                    const price = i.price || 0;
                    const qty = i.qty || 0;
                    return acc + price * qty;
                }, 0);
                const shipping = data.shippingCost || 0;
                setOrder({ ...data, total: totalItems + shipping });
            }
            catch (err) {
                console.error(err);
                setOrder(null);
            }
            finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderReference]);
    if (loading)
        return _jsx("p", { className: "text-center mt-10", children: "Chargement de la commande..." });
    if (!order)
        return (_jsx("div", { className: "flex items-center justify-center h-screen bg-red-50 p-4", children: _jsxs("div", { className: "bg-white p-10 rounded-xl shadow-lg text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4", children: "\u274C Commande introuvable" }), _jsx("p", { className: "mb-6", children: "Impossible de r\u00E9cup\u00E9rer les d\u00E9tails de votre commande." }), _jsx("a", { href: "/e-shop/", className: "bg-red-600 text-white px-6 py-2 rounded", children: "Retour au panier" })] }) }));
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen bg-green-50 p-4", children: _jsxs("div", { className: "bg-white p-8 md:p-12 rounded-xl shadow-lg w-full max-w-md text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-green-600 mb-4", children: "\u2705 Commande confirm\u00E9e !" }), _jsx("p", { className: "mb-6", children: "Merci pour votre achat. Voici le r\u00E9capitulatif :" }), _jsxs("ul", { className: "text-left mb-6", children: [order.items.map((item, i) => (_jsxs("li", { className: "flex justify-between border-b py-2", children: [_jsxs("span", { children: [item.title, item.variant?.taille ? ` (${item.variant.taille})` : "", " x", item.qty] }), _jsxs("span", { children: [(item.price * item.qty).toFixed(2), " \u20AC"] })] }, i))), order.shippingCost > 0 && (_jsxs("li", { className: "flex justify-between border-b py-2 font-semibold", children: [_jsx("span", { children: "Frais de livraison" }), _jsxs("span", { children: [order.shippingCost.toFixed(2), " \u20AC"] })] })), _jsxs("li", { className: "flex justify-between mt-2 font-bold text-lg", children: [_jsx("span", { children: "Total" }), _jsxs("span", { children: [order.total.toFixed(2), " \u20AC"] })] })] }), _jsx("a", { href: "/e-shop/", className: "bg-green-600 text-white px-6 py-2 rounded", children: "Retour \u00E0 l\u2019accueil" })] }) }));
}
