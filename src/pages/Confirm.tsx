import { useEffect, useState } from "react";
import { useCartContext } from "../components/CartContext";
import { useLocation } from "react-router-dom";

interface OrderItem {
  title: string;
  qty: number;
  variant?: { taille?: string; promotion?: number };
  price: number;
}

interface Order {
  items: OrderItem[];
  shippingCost: number;
  total: number;
}

export default function Confirm() {
  const { clearLocalCart } = useCartContext();
  const [order, setOrder] = useState<Order | null>(null);
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
        if (!res.ok) throw new Error("Commande introuvable");

        const data: { items: OrderItem[]; shippingCost: number } = await res.json();

        // ⚠️ Typage explicite pour reduce
        const totalItems: number = data.items.reduce((acc: number, i: OrderItem) => {
          const price = i.price || 0;
          const qty = i.qty || 0;
          return acc + price * qty;
        }, 0);

        const shipping = data.shippingCost || 0;
        setOrder({ ...data, total: totalItems + shipping });
      } catch (err) {
        console.error(err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderReference]);

  if (loading) return <p className="text-center mt-10">Chargement de la commande...</p>;

  if (!order)
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 p-4">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Commande introuvable</h1>
          <p className="mb-6">Impossible de récupérer les détails de votre commande.</p>
          <a href="/" className="bg-red-600 text-white px-6 py-2 rounded">
            Retour au panier
          </a>
        </div>
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Commande confirmée !</h1>
        <p className="mb-6">Merci pour votre achat. Voici le récapitulatif :</p>

        <ul className="text-left mb-6">
          {order.items.map((item: OrderItem, i: number) => (
            <li key={i} className="flex justify-between border-b py-2">
              <span>
                {item.title}
                {item.variant?.taille ? ` (${item.variant.taille})` : ""} x{item.qty}
              </span>
              <span>{(item.price * item.qty).toFixed(2)} €</span>
            </li>
          ))}
          {order.shippingCost > 0 && (
            <li className="flex justify-between border-b py-2 font-semibold">
              <span>Frais de livraison</span>
              <span>{order.shippingCost.toFixed(2)} €</span>
            </li>
          )}
          <li className="flex justify-between mt-2 font-bold text-lg">
            <span>Total</span>
            <span>{order.total.toFixed(2)} €</span>
          </li>
        </ul>

        <a href="/" className="bg-green-600 text-white px-6 py-2 rounded">
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
