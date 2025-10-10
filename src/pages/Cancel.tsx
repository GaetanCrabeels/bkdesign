export default function Cancel() {
  return (
    <div className="flex items-center justify-center h-screen bg-yellow-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">⚠️ Commande annulée</h1>
        <p className="text-gray-700 mb-6">
          Vous avez annulé le processus de livraison BPOST. Votre panier reste intact.
        </p>
        <a
          href="/shop/"
          className="inline-block bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
        >
          Retour au panier
        </a>
      </div>
    </div>
  );
}
