import { useState } from "react";
import { CartItem } from "../types/product";
import crypto from "crypto";

interface CartModalProps {
  items: CartItem[];
  onClose: () => void;
  onUpdateCart: (updatedItems: CartItem[]) => void;
}

export default function CartModal({ items, onClose, onUpdateCart }: CartModalProps) {
  const [shippingMethod, setShippingMethod] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState(0);

  // 🔹 Total panier sans livraison
  const total = items.reduce((acc, item) => {
    const promo = item.variant?.promotion || 0;
    const price = promo > 0 ? item.price * (1 - promo / 100) : item.price;
    return acc + price * item.qty;
  }, 0);

  const totalWithShipping = total + shippingCost;

  // 🔹 Gestion quantité et suppression
  const increaseQty = (id: string) => {
    const updated = items.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
    onUpdateCart(updated);
  };

  const decreaseQty = (id: string) => {
    const updated = items
      .map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0); // supprime si qty = 0
    onUpdateCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    onUpdateCart(updated);
  };

  // 🔹 Checkout Stripe
  const handleCheckout = async () => {
    if (!items.length) return;
    const res = await fetch("http://localhost:4242/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Erreur lors de la création de la session Stripe");
  };

  // 🔹 Génération checksum SHA-256 (pour BPOST)
  const generateBpostChecksum = (params: Record<string, string>, passphrase: string) => {
    const hashFields = [
      "accountId",
      "costCenter",
      "customerCountry",
      "deliveryMethodOverrides",
      "extraSecure",
      "orderLine",
      "orderReference",
      "orderTotalPrice",
      "orderWeight",
    ];

    const filtered: Record<string, string> = {};
    for (const key of hashFields) {
      if (params[key] !== undefined) filtered[key] = params[key];
    }

    const sortedKeys = Object.keys(filtered).sort();
    const concatenated = sortedKeys.map(k => `${k}=${filtered[k]}`).join("&") + `&${passphrase}`;

    return crypto.createHash("sha256").update(concatenated, "utf8").digest("hex");
  };

  // 🔹 Popup BPOST
  const openBpostPopup = async () => {
    const res = await fetch("http://localhost:4242/bpost/get-shm-params", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const params = await res.json();
    console.log("📦 Params reçus du serveur:", params);

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
    setShippingMethod("BPOST");
    setShippingCost(params.shippingCost || 0); // mettre à jour si serveur renvoie le coût
  };

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
                const price = promo > 0
                  ? (item.price * (1 - promo / 100)).toFixed(2)
                  : item.price.toFixed(2);

                return (
                  <li key={item.id} className="flex flex-col py-2 border-b border-[#2a2b2c]">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{item.title}</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                    </div>
                    {item.variant?.taille && <span>Taille : {item.variant.taille}</span>}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => decreaseQty(item.id)}
                          className="px-2 py-1 bg-[#2a2b2c] rounded hover:bg-[#3a3b3c]"
                        >
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button
                          onClick={() => increaseQty(item.id)}
                          className="px-2 py-1 bg-[#2a2b2c] rounded hover:bg-[#3a3b3c]"
                        >
                          +
                        </button>
                      </div>
                      <span>{price} €</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4">
              <button
                onClick={openBpostPopup}
                className="bg-[#ffc272] text-black p-2 rounded hover:bg-[#e6aa50] transition w-full"
              >
                Choisir la livraison BPOST
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

            <button
              onClick={handleCheckout}
              className="bg-[#ffc272] text-black mt-4 p-2 rounded hover:bg-[#e6aa50] transition w-full"
            >
              Passer à la caisse
            </button>
          </>
        )}
      </div>
    </div>
  );
}
