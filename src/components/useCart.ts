import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { CartItem } from "../types/product";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return; // ⚡ fusion serveur/local déjà faite

    const loadCart = async () => {
      // 1️⃣ Panier local
      const local = localStorage.getItem("cart");
      let localCart: CartItem[] = local ? JSON.parse(local) : [];

      // 2️⃣ Panier serveur si connecté
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      let mergedCart = localCart;

      if (currentUser) {
        const { data, error } = await supabase
          .from("profiles")
          .select("panier")
          .eq("id", currentUser.id)
          .single();

        const serverCart: CartItem[] = data?.panier || [];

        // 🔹 Fusion locale + serveur uniquement une fois
        const mergedMap = new Map<string, CartItem>();
        serverCart.forEach(item => mergedMap.set(item.id, { ...item }));
        localCart.forEach(item => {
          const existing = mergedMap.get(item.id);
          if (existing) existing.qty = Math.max(existing.qty, item.qty);
          else mergedMap.set(item.id, { ...item });
        });

        mergedCart = Array.from(mergedMap.values());

        if (JSON.stringify(mergedCart) !== JSON.stringify(serverCart)) {
          await supabase.from("profiles").update({ panier: mergedCart }).eq("id", currentUser.id);
        }
      }

      // 3️⃣ Sauvegarde locale et state
      setCart(mergedCart);
      localStorage.setItem("cart", JSON.stringify(mergedCart));

      setInitialized(true);
    };

    loadCart();
  }, [initialized]);

  // 🔹 Mettre à jour le panier sans relancer la fusion
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    if (user) supabase.from("profiles").update({ panier: newCart }).eq("id", user.id);
  };

  // 🔹 Ajouter un produit
  const addToCart = (item: CartItem) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      updateCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i));
    } else {
      updateCart([...cart, item]);
    }
  };

  return { cart, addToCart, updateCart };
}
