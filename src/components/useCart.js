import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
export function useCart() {
    const [cart, setCart] = useState([]);
    const [user, setUser] = useState(null);
    // --- Charger le panier local et DB au montage
    useEffect(() => {
        const initCart = async () => {
            // 1️⃣ Panier local
            const local = localStorage.getItem("cart");
            let localCart = local ? JSON.parse(local) : [];
            // 2️⃣ Utilisateur connecté
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
            if (currentUser) {
                // 3️⃣ Panier serveur
                const { data, error } = await supabase
                    .from("profiles")
                    .select("panier")
                    .eq("id", currentUser.id)
                    .single();
                const serverCart = data?.panier || [];
                // 4️⃣ Fusion des paniers : on garde max qty pour chaque produit
                const mergedMap = new Map();
                serverCart.forEach(item => mergedMap.set(item.id, { ...item }));
                localCart.forEach(item => {
                    const existing = mergedMap.get(item.id);
                    if (existing)
                        existing.qty = Math.max(existing.qty, item.qty);
                    else
                        mergedMap.set(item.id, { ...item });
                });
                const mergedCart = Array.from(mergedMap.values());
                // ✅ Vérifie que les quantités ne dépassent pas le stock disponible
                const validatedCart = mergedCart.map(item => {
                    const stock = item.variant?.quantity ?? Infinity;
                    return {
                        ...item,
                        qty: Math.min(item.qty, stock),
                    };
                });
                // 5️⃣ Mettre à jour state, localStorage et DB
                setCart(validatedCart);
                localStorage.setItem("cart", JSON.stringify(validatedCart));
                if (JSON.stringify(validatedCart) !== JSON.stringify(serverCart)) {
                    await supabase.from("profiles").update({ panier: validatedCart }).eq("id", currentUser.id);
                }
            }
            else {
                // Pas connecté : juste local
                setCart(localCart);
            }
        };
        initCart();
    }, []);
    const clearLocalCart = () => {
        setCart([]);
        localStorage.removeItem("cart");
    };
    // --- Fonction pour mettre à jour le panier
    const updateCart = async (newCart) => {
        setCart(newCart);
        localStorage.setItem("cart", JSON.stringify(newCart));
        // Si connecté, mettre à jour la DB
        if (user) {
            await supabase.from("profiles").update({ panier: newCart }).eq("id", user.id);
        }
    };
    // --- Ajouter un produit
    const addToCart = (item) => {
        const existing = cart.find(i => i.id === item.id);
        // ✅ Vérifier la limite de stock
        const maxQty = item.variant?.quantity ?? item.qty;
        const newQty = existing ? existing.qty + item.qty : item.qty;
        if (newQty > maxQty) {
            alert(`Stock insuffisant : seulement ${maxQty} article(s) disponible(s) pour cette variante.`);
            return;
        }
        // ✅ Mettre à jour le panier normalement
        if (existing) {
            updateCart(cart.map(i => i.id === item.id ? { ...i, qty: newQty } : i));
        }
        else {
            updateCart([...cart, item]);
        }
    };
    // --- Supprimer un produit
    const removeFromCart = (productId) => {
        updateCart(cart.filter(i => i.id !== productId));
    };
    // --- Modifier la quantité
    const setItemQty = (productId, qty) => {
        updateCart(cart.map(i => i.id === productId ? { ...i, qty } : i));
    };
    // --- Nombre total d'articles
    const cartCount = cart.reduce((sum, i) => sum + (i.qty ?? 1), 0);
    // --- Vider complètement le panier
    const clearCart = async () => {
        setCart([]);
        localStorage.removeItem("cart");
        if (user) {
            await supabase.from("profiles").update({ panier: [] }).eq("id", user.id);
        }
    };
    return {
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        setItemQty,
        updateCart,
        clearCart, // Vide panier + DB si connecté
        clearLocalCart, // Vide seulement le panier local
        user
    };
}
