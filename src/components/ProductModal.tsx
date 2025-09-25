import React, { useState } from "react";
import { Product } from "../types/product";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, qty: number, color?: string) => void;
}

export function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product.colors[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Fenêtre du modal */}
      <div className="relative  rounded-lg shadow-lg max-w-3xl w-full p-6 z-10">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image produit */}
          <img
            src={product.image}
            alt={product.title}
            className="w-full md:w-64 h-64 object-cover rounded"
          />

          {/* Contenu texte */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{product.title}</h2>
            <p className="text-gray-600 mt-2">{product.description}</p>
            <div className="mt-4">
              Prix : <span className="font-bold">€{product.price}</span>
            </div>

            {/* Couleurs */}
            <div className="mt-4">
              <label className="block text-sm">Couleur</label>
              <div className="flex gap-2 mt-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`px-2 py-1 border rounded ${
                      color === c ? "ring-2 ring-offset-1" : ""
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantité */}
            <div className="mt-4 flex items-center gap-2">
              <label>Quantité</label>
              <input
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                type="number"
                min={1}
                className="w-20 border rounded px-2 py-1"
              />
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  onAdd(product, qty, color);
                  onClose();
                }}
                className="px-4 py-2 bg-gray-900 text-[#b58545] rounded"
              >
                Ajouter au panier
              </button>
              <button onClick={onClose} className="px-4 py-2 border rounded">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
