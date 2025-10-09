export default function Error() {
  return (
    <div className="flex items-center justify-center h-screen bg-red-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Erreur BPOST</h1>
        <p className="text-gray-700 mb-6">
          Une erreur est survenue lors de la création de la commande.
          Veuillez réessayer ou contacter le support.
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
}
