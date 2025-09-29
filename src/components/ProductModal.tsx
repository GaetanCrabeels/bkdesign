import { useState } from "react";
import { Product } from "../types/product";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, qty: number) => void;
}

export default function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  const [qty, setQty] = useState(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#ecddc9] text-[#111213] rounded-lg shadow-lg  p-8 pt-4 z-10  max-w-[90vw]">
        <button
      onClick={onClose}
      className="absolute top-0 right-1 text-[#000000] hover:text-white text-2xl"
      aria-label="Fermer"
    >
      ✕
    </button>
        <div className="flex flex-col md:flex-row gap-6 text-justify items-center ">
          <img
            src={product.image_url}
            alt={product.title}
            width={256}
            height={256}
            loading="eager"
            decoding="async"
            className="rounded object-cover w-full md:w-64 h-64 "
          />

          <div className="flex flex-col">
            <h2 className="text-2xl sm:text-3xl text-center font-bold">
              {product.title}
            </h2>
            {product.subcategory && (
              <p className="text-sm italic mt-3 text-center">
                {product.category} &gt; {product.subcategory}
              </p>
            )}
            <p className="mt-5">{product.description}</p>
            <div className="mt-6 mb-2">
              Prix :{" "}
              <span className="font-bold">€{product.price.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 justify-between">
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
                className="px-4 py-2 bg-[#ca7322] text-white rounded hover:bg-[#ffc272] transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#ca7322] text-white hover:bg-[#ffc272] transition-colors"
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
