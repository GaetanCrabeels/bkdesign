import { useEffect, useState } from "react";
import { CartItem } from "../types/product";
import { supabase } from "../lib/supabaseClient";

interface CartModalProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateCart: (updatedItems: CartItem[]) => void;
}

export default function CartModal({ items, onClose, onUpdateCart }: CartModalProps) {
  const [user, setUser] = useState<any>(null);
  const [country, setCountry] = useState<string>("BE");
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [bpostReference, setBpostReference] = useState<string | null>(null);

  // -----------------------------
  // Effet pour initialiser l'utilisateur et récupérer le panier
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

        if (data?.panier) onUpdateCart(data.panier);
      }
    };

    initUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [onUpdateCart]);

  // -----------------------------
  // Effet pour gérer la gratuité des frais de port
  // -----------------------------
  const total = items.reduce((acc, item) => {
    const promo = item.variant?.promotion || 0;
    const price = promo > 0 ? item.price * (1 - promo / 100) : item.price;
    return acc + price * item.qty;
  }, 0);

  useEffect(() => {
    if (total >= 75) {
      setShippingCost(0);
    }
  }, [total]);

  const totalWithShipping = total + shippingCost;

  // -----------------------------
  // Fonctions de gestion du panier
  // -----------------------------
  const saveCart = async (updatedItems: CartItem[]) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ panier: updatedItems })
      .eq("id", user.id);
  };

  const updateCart = async (updatedItems: CartItem[]) => {
    onUpdateCart(updatedItems);
    await saveCart(updatedItems);
  };

  const increaseQty = async (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
    await updateCart(updated);
  };

  const decreaseQty = async (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0);
    await updateCart(updated);
  };

  const removeItem = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    await updateCart(updated);
  };

  // -----------------------------
  // Checkout Stripe
  // -----------------------------
  const handleCheckout = async () => {
    if (!items.length) return;

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
    if (data.url) window.location.href = data.url;
    else alert("Erreur lors de la création de la session Stripe");
  };

  // -----------------------------
  // BPOST popup + confirmation
  // -----------------------------
  const handleBpost = async () => {
    if (!deliveryConfirmed) {
      // 1) On lance BPOST et récupère les params
      const res = await fetch("https://bkdesign.onrender.com/bpost/get-shm-params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, country }),
      });

      const params = await res.json();
      const bpostOrderRef = params.orderReference;

      // 2) On ouvre la popup
      const popup = window.open("", "BPOST", "width=1024,height=768");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://shippingmanager.bpost.be/ShmFrontEnd/start";
      form.target = popup!.name;

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

      // 3) Poll jusqu’à ce que les frais soient disponibles
      const checkShippingCost = setInterval(async () => {
        try {
          const confirmRes = await fetch(
            `https://bkdesign.onrender.com/bpost/get-shipping?orderReference=${bpostOrderRef}`
          );

          if (confirmRes.ok) {
            const data = await confirmRes.json();
            const cost = total >= 75 ? 0 : data.shippingCost;
            setShippingCost(cost);
            setShippingMethod("BPOST");
            setDeliveryConfirmed(true);
            setBpostReference(bpostOrderRef);

            clearInterval(checkShippingCost);
          }
        } catch (err) {
          console.error("Erreur lors de la récupération des frais BPOST :", err);
        }
      }, 1500);
    } else {
      // Si la livraison est confirmée, lancer Stripe
      handleCheckout();
    }
  };

  // -----------------------------
  // JSX du composant
  // -----------------------------
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-[#111213] sm:w-96 w-full max-h-screen p-6 shadow-xl flex flex-col rounded-l-lg">
        <button onClick={onClose} className="self-end text-[#ffc272] hover:text-white">✕</button>
        <h2 className="text-2xl sm:text-3xl mb-4 text-center">Votre Panier</h2>

        {items.length === 0 ? (
          <p className="text-white text-lg text-center">Votre panier est vide.</p>
        ) : (
          <>
            <ul className="overflow-y-auto space-y-2 flex-1">
              {items.map(item => {
                const promo = item.variant?.promotion || 0;
                const price = promo > 0 ? (item.price * (1 - promo / 100)).toFixed(2) : item.price.toFixed(2);
                return (
                  <li key={item.id} className="flex flex-col py-2 border-b border-[#2a2b2c]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{item.title}</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                    {item.variant?.taille && <span>Taille : {item.variant.taille}</span>}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => decreaseQty(item.id)} className="px-2 py-1 bg-[#2a2b2c] rounded hover:bg-[#3a3b3c]">-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => increaseQty(item.id)} className="px-2 py-1 bg-[#2a2b2c] rounded hover:bg-[#3a3b3c]">+</button>
                      </div>
                      <span>{price} €</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mb-4">
              <span className="text-white mr-2">Choisir le pays :</span>
              {["BE", "FR", "LU", "NL"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`px-2 py-1 m-1 rounded ${country === c ? "bg-[#ffc272] text-black" : "bg-[#2a2b2c] text-white"}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <button
                onClick={handleBpost}
                className="bg-[#ffc272] text-black p-2 rounded hover:bg-[#e6aa50] transition w-full"
              >
                {deliveryConfirmed ? "Passer au paiement" : "Choisir la livraison BPOST"}
              </button>
              {shippingMethod && (
                <p className="text-white mt-2 text-sm">
                  Livraison sélectionnée : {shippingMethod} ({shippingCost.toFixed(2)} €)
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-lg">Total :</span>
              <span className="text-lg font-bold">{totalWithShipping.toFixed(2)} €</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
