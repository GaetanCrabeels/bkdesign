import React, { useState } from "react";
import { Product } from "../types/product";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, qty: number, color?: string) => void;
}

export function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Fenêtre du modal */}
      <div className="relative bg-[#ecddc9] text-[#111213] rounded-lg shadow-lg max-w-3xl w-full p-6 z-10">
        <div className="flex flex-col md:flex-row gap-6 text-justify justify-center items-center h-full mr-5 ml-5">
          {/* Image produit */}
          <img 
            src={product.image_url}
            alt={product.title}
            className="w-full md:w-64 h-64 object-cover rounded  "
          />

          {/* Contenu texte */}
          <div className="flex flex-col h-full">
            <h2 className="text-4xl text-[#111213]  text-center ">{product.title}</h2>

            {product.subcategory && (
              <p className="text-sm italic mt-3  text-[#111213] ">
                {product.category} &gt; {product.subcategory}
              </p>
            )}

            <p className="text-[#111213] text-lg align-text-bottom
             mt-7">{product.description}</p>
            <div className="mt-9 mb-2">
              Prix :{" "}
              <span className="font-extrabold  text-[#111213]">
                €{product.price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-2 justify-between">
              <label>Quantité</label>
              <input
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                type="number"
                min={1}
                className="w-20 border rounded px-2 py-1"
              />
                            <button
                onClick={() => {
                  onAdd(product, qty);
                  onClose();
                }}
                className="px-4 py-2 bg-[#ca7322] text-[#ffffff] rounded hover:bg-[#ffc272] transition-colors"
              >
                Ajouter au panier
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#ca7322] border rounded hover:bg-[#ffc272] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
