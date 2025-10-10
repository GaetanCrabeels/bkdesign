import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { CartItem } from "../types/product";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // --- Charger le panier local et DB au montage
  useEffect(() => {
    const initCart = async () => {
      // 1️⃣ Panier local
      const local = localStorage.getItem("cart");
      let localCart: CartItem[] = local ? JSON.parse(local) : [];

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

        const serverCart: CartItem[] = data?.panier || [];

        // 4️⃣ Fusion des paniers : on garde max qty pour chaque produit
        const mergedMap = new Map<string, CartItem>();
        serverCart.forEach(item => mergedMap.set(item.id, { ...item }));
        localCart.forEach(item => {
          const existing = mergedMap.get(item.id);
          if (existing) existing.qty = Math.max(existing.qty, item.qty);
          else mergedMap.set(item.id, { ...item });
        });

        const mergedCart = Array.from(mergedMap.values());

        // 5️⃣ Mettre à jour state, localStorage et DB
        setCart(mergedCart);
        localStorage.setItem("cart", JSON.stringify(mergedCart));
        if (JSON.stringify(mergedCart) !== JSON.stringify(serverCart)) {
          await supabase.from("profiles").update({ panier: mergedCart }).eq("id", currentUser.id);
        }
      } else {
        // Pas connecté : juste local
        setCart(localCart);
      }
    };

    initCart();
  }, []);

  // --- Fonction pour mettre à jour le panier
  const updateCart = async (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));

    // Si connecté, mettre à jour la DB
    if (user) {
      await supabase.from("profiles").update({ panier: newCart }).eq("id", user.id);
    }
  };

  // --- Ajouter un produit
  const addToCart = (item: CartItem) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      updateCart(cart.map(i => i.id === item.id ? { ...i, qty: i.qty + item.qty } : i));
    } else {
      updateCart([...cart, item]);
    }
  };

  // --- Supprimer un produit
  const removeFromCart = (productId: string) => {
    updateCart(cart.filter(i => i.id !== productId));
  };

  // --- Modifier la quantité
  const setItemQty = (productId: string, qty: number) => {
    updateCart(cart.map(i => i.id === productId ? { ...i, qty } : i));
  };

  // --- Nombre total d'articles
  const cartCount = cart.reduce((sum, i) => sum + (i.qty ?? 1), 0);

  return { cart, cartCount, addToCart, removeFromCart, setItemQty, updateCart, user };
}
