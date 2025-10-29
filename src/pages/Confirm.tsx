import { useEffect, useState } from "react";
import { useCartContext } from "../components/CartContext";
import { useLocation } from "react-router-dom";

interface OrderItem {
  title: string;
  qty: number;
  variant?: { taille?: string };
  price: number;
}

interface Order {
  items: OrderItem[];
  shippingCost: number;
  total: number;
}

export default function Confirm() {
  const { clearLocalCart } = useCartContext(); // Nouveau : ne touche pas à la DB
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupération de l'orderReference depuis l'URL
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderReference = searchParams.get("orderReference");

  // Vide le panier local dès l'arrivée sur la page
  useEffect(() => {
    clearLocalCart?.();
  }, []); // ✅ Dépendances vides pour ne pas boucler

  // Récupération des détails de la commande depuis l'API
  useEffect(() => {
    if (!orderReference) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${orderReference}`);
        if (!res.ok) throw new Error("Commande introuvable");
        const data = await res.json();

        const totalItems = data.items.reduce(
          (acc: number, item: OrderItem) => acc + item.price * item.qty,
          0
        );

        setOrder({ ...data, total: totalItems + (data.shippingCost || 0) });
      } catch (err) {
        console.error(err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderReference]);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-700">
        Chargement de la commande...
      </p>
    );

  if (!order)
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 p-4">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Commande introuvable</h1>
          <p className="text-gray-700 mb-6">
            Impossible de récupérer les détails de votre commande.
          </p>
          <a
            href="/"
            className="inline-block bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            Retour au panier
          </a>
        </div>
      </div>
    );

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50 p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Commande confirmée !</h1>
        <p className="text-gray-700 mb-6">
          Merci pour votre achat. Voici le récapitulatif de votre commande :
        </p>

        <ul className="text-left mb-6">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between border-b py-2">
              <span>
                {item.title} {item.variant?.taille ? `(${item.variant.taille})` : ""} x{item.qty}
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

        <a
          href="/"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
