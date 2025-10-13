import { useEffect } from "react";
import { useCartContext } from "../components/CartContext";

export default function Confirm() {
  const { clearCart } = useCartContext(); // ✅ Récupération de clearCart depuis le contexte

  useEffect(() => {
    // 🧹 Vide le panier dès qu'on arrive sur la page de confirmation
    clearCart();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-green-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Commande confirmée !</h1>
        <p className="text-gray-700 mb-6">
          Votre commande a été validée avec succès.
        </p>
        <a
          href="/shop/"
          className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Retour à l’accueil
        </a>
      </div>
    </div>
  );
}
