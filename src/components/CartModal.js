import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
export default function CartModal({ items, onClose, onUpdateCart }) {
    const [user, setUser] = useState(null);
    const [country, setCountry] = useState("BE");
    const [shippingMethod, setShippingMethod] = useState(null);
    const [shippingCost, setShippingCost] = useState(0);
    const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
    const [bpostReference, setBpostReference] = useState(null);
    // -----------------------------
    // Initialisation utilisateur + panier depuis Supabase
    // -----------------------------
    useEffect(() => {
        const initUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("panier")
                    .eq("id", session.user.id)
                    .single();
                if (data?.panier)
                    onUpdateCart(data.panier);
            }
        };
        initUser();
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => listener.subscription.unsubscribe();
    }, [onUpdateCart]);
    // -----------------------------
    // Calcul des totaux
    // -----------------------------
    const total = items.reduce((acc, item) => {
        const promo = item.variant?.promotion || 0;
        const price = promo > 0 ? item.price * (1 - promo / 100) : item.price;
        return acc + price * item.qty;
    }, 0);
    useEffect(() => {
        if (total >= 75)
            setShippingCost(0);
    }, [total]);
    const totalWithShipping = total + shippingCost;
    // -----------------------------
    // Gestion du panier et persistance
    // -----------------------------
    const saveCart = async (updatedItems) => {
        if (!user)
            return;
        await supabase.from("profiles").update({ panier: updatedItems }).eq("id", user.id);
    };
    const updateCart = async (updatedItems) => {
        onUpdateCart(updatedItems);
        await saveCart(updatedItems);
    };
    // 🔍 Vérifie le stock dans Supabase pour un article donné
    const fetchStockForVariant = async (variantId) => {
        const { data, error } = await supabase
            .from("product_variants")
            .select("quantity")
            .eq("id", variantId)
            .single();
        if (error) {
            console.error("Erreur de récupération du stock :", error);
            return 0;
        }
        return data?.quantity ?? 0;
    };
    // ➕ Augmenter la quantité avec contrôle du stock
    const increaseQty = async (id) => {
        const item = items.find(i => i.id === id);
        if (!item?.variant?.id)
            return;
        const availableQty = await fetchStockForVariant(item.variant.id);
        if (item.qty >= availableQty) {
            alert(`Stock disponible : ${availableQty}`);
            return;
        }
        const updated = items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
        await updateCart(updated);
    };
    // ➖ Diminuer la quantité
    const decreaseQty = async (id) => {
        const updated = items.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
            .filter(i => i.qty > 0);
        await updateCart(updated);
    };
    // ❌ Supprimer un article
    const removeItem = async (id) => {
        const updated = items.filter(i => i.id !== id);
        await updateCart(updated);
    };
    // -----------------------------
    // Vérification avant paiement Stripe
    // -----------------------------
    const validateCartBeforeCheckout = async () => {
        for (const item of items) {
            if (!item.variant?.id)
                continue;
            const availableQty = await fetchStockForVariant(item.variant.id);
            if (item.qty > availableQty) {
                alert(`La quantité demandée pour "${item.title}" dépasse le stock (${availableQty} disponibles).`);
                return false;
            }
        }
        return true;
    };
    // -----------------------------
    // Paiement Stripe avec vérification
    // -----------------------------
    const handleCheckout = async () => {
        if (!items.length)
            return;
        const valid = await validateCartBeforeCheckout();
        if (!valid)
            return;
        const res = await fetch("https://bkdesign.onrender.com/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items,
                customerEmail: user?.email,
                shippingCost,
                orderReference: bpostReference,
            }),
        });
        const data = await res.json();
        if (data.url)
            window.location.href = data.url;
        else
            alert("Erreur lors de la création de la session Stripe");
    };
    // -----------------------------
    // Gestion BPOST + confirmation
    // -----------------------------
    const handleBpost = async () => {
        if (!deliveryConfirmed) {
            const res = await fetch("https://bkdesign.onrender.com/bpost/get-shm-params", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, country }),
            });
            const params = await res.json();
            const bpostOrderRef = params.orderReference;
            const popup = window.open("", "BPOST", "width=1024,height=768");
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "https://shippingmanager.bpost.be/ShmFrontEnd/start";
            form.target = popup.name;
            Object.entries(params).forEach(([k, v]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = k;
                input.value = String(v);
                form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            const checkShippingCost = setInterval(async () => {
                try {
                    const confirmRes = await fetch(`https://bkdesign.onrender.com/bpost/get-shipping?orderReference=${bpostOrderRef}`);
                    if (confirmRes.ok) {
                        const data = await confirmRes.json();
                        const cost = total >= 75 ? 0 : data.shippingCost;
                        setShippingCost(cost);
                        setShippingMethod("BPOST");
                        setDeliveryConfirmed(true);
                        setBpostReference(bpostOrderRef);
                        clearInterval(checkShippingCost);
                    }
                }
                catch (err) {
                    console.error("Erreur lors de la récupération des frais BPOST :", err);
                }
            }, 1500);
        }
        else {
            handleCheckout();
        }
    };
    // -----------------------------
    // Rendu JSX
    // -----------------------------
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex justify-end z-50", children: _jsxs("div", { className: "bg-[#111213] sm:w-96 w-full max-h-screen p-6 shadow-xl flex flex-col rounded-l-lg", children: [_jsx("button", { onClick: onClose, className: "self-end text-[#ffc272] hover:text-white", children: "\u2715" }), _jsx("h2", { className: "text-2xl sm:text-3xl mb-4 text-center", children: "Votre Panier" }), items.length === 0 ? (_jsx("p", { className: "text-white text-lg text-center", children: "Votre panier est vide." })) : (_jsxs(_Fragment, { children: [_jsx("ul", { className: "overflow-y-auto space-y-2 flex-1", children: items.map(item => {
                                const promo = item.variant?.promotion || 0;
                                const price = promo > 0 ? (item.price * (1 - promo / 100)).toFixed(2) : item.price.toFixed(2);
                                return (_jsxs("li", { className: "flex flex-col py-2 border-b border-[#2a2b2c]", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "font-semibold", children: item.title }), _jsx("button", { onClick: () => removeItem(item.id), className: "text-red-500 hover:text-red-700", children: "\u2715" })] }), item.variant?.taille && _jsxs("span", { children: ["Taille : ", item.variant.taille] }), _jsxs("div", { className: "flex items-center justify-between mt-1", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => decreaseQty(item.id), className: "px-2 py-1 bg-[#2a2b2c] rounded hover:bg-[#3a3b3c]", children: "-" }), _jsx("span", { children: item.qty }), _jsx("button", { onClick: () => increaseQty(item.id), className: "px-2 py-1 bg-[#2a2b2c] rounded hover:bg-[#3a3b3c]", children: "+" })] }), _jsxs("span", { children: [price, " \u20AC"] })] })] }, item.id));
                            }) }), _jsxs("div", { className: "mb-4", children: [_jsx("span", { className: "text-white mr-2", children: "Choisir le pays :" }), ["BE", "FR", "LU", "NL"].map((c) => (_jsx("button", { onClick: () => setCountry(c), className: `px-2 py-1 m-1 rounded ${country === c ? "bg-[#ffc272] text-black" : "bg-[#2a2b2c] text-white"}`, children: c }, c)))] }), _jsxs("div", { className: "mt-4", children: [_jsx("button", { onClick: handleBpost, className: "bg-[#ffc272] text-black p-2 rounded hover:bg-[#e6aa50] transition w-full", children: deliveryConfirmed ? "Passer au paiement" : "Choisir la livraison BPOST" }), shippingMethod && (_jsxs("p", { className: "text-white mt-2 text-sm", children: ["Livraison s\u00E9lectionn\u00E9e : ", shippingMethod, " (", shippingCost.toFixed(2), " \u20AC)"] }))] }), _jsxs("div", { className: "flex justify-between items-center mt-4", children: [_jsx("span", { className: "text-lg", children: "Total :" }), _jsxs("span", { className: "text-lg font-bold", children: [totalWithShipping.toFixed(2), " \u20AC"] })] })] }))] }) }));
}
