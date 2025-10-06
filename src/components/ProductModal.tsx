import { useState, useEffect } from "react";
import { Product, CartItem } from "../types/product";
import { supabase } from "../lib/supabaseClient";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

// 🔹 Interface complète de la variante, compatible avec CartItem.variant
interface ProductVariant {
  id: string;
  produit_id: string;
  taille: string;
  poids: number;
  promotion: number;
  quantity: number;
  created_at?: string;
}

export default function ProductModal({ product, onClose, onAdd }: ProductModalProps) {
  const [qty, setQty] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedTaille, setSelectedTaille] = useState<string>("");

  useEffect(() => {
    async function fetchVariants() {
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, produit_id, taille, poids, promotion, quantity, created_at")
        .eq("produit_id", product.id);

      if (!error && data) {
        setVariants(data);
        if (data.length > 0) setSelectedTaille(data[0].taille);
      }
    }
    fetchVariants();
  }, [product.id]);

  const selectedVariant = variants.find(v => v.taille === selectedTaille);
  const promo = selectedVariant?.promotion || 0;
  const discountedPrice =
    promo > 0 ? (product.price * (1 - promo / 100)).toFixed(2) : product.price.toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#ecddc9] text-[#111213] rounded-lg shadow-lg p-8 pt-4 z-10 max-w-[90vw]">
        <button
          onClick={onClose}
          className="absolute top-0 right-1 text-[#000000] hover:text-white text-2xl"
          aria-label="Fermer"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row gap-6 text-justify items-center">
          <img
            src={product.image_url}
            alt={product.title}
            width={256}
            height={256}
            loading="eager"
            decoding="async"
            className="rounded object-cover w-full md:w-64 h-64"
          />

          <div className="flex flex-col flex-1">
            <h2 className="text-2xl sm:text-3xl text-center font-bold">{product.title}</h2>
            {product.subcategory && (
              <p className="text-sm italic mt-3 text-center">
                {product.category} &gt; {product.subcategory}
              </p>
            )}
            <p className="mt-5">{product.description}</p>

            {/* Sélecteur de taille */}
            {variants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 mt-3 justify-center">
                {variants
                  .filter(v => v.taille) // ne garde que les variants avec une taille
                  .map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedTaille(v.taille)}
                      className={`px-2 py-1 text-xs rounded border ${selectedTaille === v.taille
                          ? "bg-[#ffc272] text-black border-[#ffc272]"
                          : "bg-transparent text-black border-gray-600 hover:border-[#ffc272]"
                        }`}
                    >
                      {v.taille}
                    </button>
                  ))}
              </div>
            )}

            {/* Prix */}
            <div className="mt-6 mb-2">
              Prix : <span className="font-bold">{discountedPrice} €</span>
              {promo > 0 && (
                <span className="line-through text-gray-500 ml-2">{product.price.toFixed(2)} €</span>
              )}
            </div>

            {/* Quantité + boutons */}
            <div className="flex items-center gap-2 justify-between mt-4">
              <input
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                type="number"
                min={1}
                className="w-20 border rounded px-2 py-1"
              />
              <button
                onClick={() => {
                  if (!selectedVariant) return;
                  const cartItem: CartItem = {
                    id: product.id + "_" + selectedVariant.id,
                    title: product.title,
                    price: product.price,
                    qty,
                    variantKey: selectedVariant.taille,
                    variant: selectedVariant,
                  };
                  onAdd(cartItem);
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
