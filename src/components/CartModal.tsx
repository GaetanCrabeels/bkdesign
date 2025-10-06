import { CartItem } from "../types/product";

interface CartModalProps {
  items: CartItem[];
  onClose: () => void;
}

export default function CartModal({ items, onClose }: CartModalProps) {
  const total = items.reduce((acc, item) => {
    const promo = item.variant?.promotion || 0;
    const price = promo > 0 ? item.price * (1 - promo / 100) : item.price;
    return acc + price * item.qty;
  }, 0);

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
                    <span className="font-semibold">{item.title}</span>
                    {item.variant?.taille && <span>Taille : {item.variant.taille}</span>}
                    <span>{item.qty} × {price} €</span>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between items-center mt-4">
              <span className="text-lg">Total :</span>
              <span className="text-lg font-bold">{total.toFixed(2)} €</span>
            </div>
            <button
              onClick={handleCheckout}
              className="bg-[#ffc272] text-black mt-4 p-2 rounded hover:bg-[#e6aa50] transition"
            >
              Passer à la caisse
            </button>
          </>
        )}
      </div>
    </div>
  );
}
