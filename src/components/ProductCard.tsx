import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product } from "../types/product";

export interface ProductCardProps {
  product: Product;
  onAdd?: (p: Product) => void;
  onOpen?: () => void;
}

interface ProductVariant {
  taille: string;
  poids: number;
  promotion: number;
}

export function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedTaille, setSelectedTaille] = useState<string>("");

  useEffect(() => {
    async function fetchVariants() {
      const { data, error } = await supabase
        .from("product_variants")
        .select("taille, poids, promotion")
        .eq("produit_id", product.id);

      if (!error && data) {
        setVariants(data);
        // Sélection par défaut : la première taille dispo
        if (data.length > 0) setSelectedTaille(data[0].taille);
      }
    }
    fetchVariants();
  }, [product.id]);

  // Variante sélectionnée
  const selectedVariant = variants.find(
    (v) => v.taille === selectedTaille
  );

  // Promo spécifique à la taille
  const promo = selectedVariant?.promotion || 0;

  // Prix remisé
  const discountedPrice =
    promo > 0 ? (product.price * (1 - promo / 100)).toFixed(2) : null;

  const taillesDisponibles = Array.from(
    new Set(variants.map((v) => v.taille).filter(Boolean))
  );

  return (<div>
    {/* Sticker promo */}
    {promo > 0 && (
      <div
        className="absolute text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-full shadow-md"
        style={{ background: "linear-gradient(to right, #ef4444, #f97316)" }}
      >
        -{promo}%
      </div>
    )}
    <div
      className="p-4 bg-[#111213] border border-[#2a2b2c] rounded-md shadow hover:shadow-lg transition cursor-pointer flex flex-col min-h-96 " // fixe la hauteur
      onClick={onOpen}
    >


      {/* Image + contenu variable */}
      <div className="flex-1 flex flex-col">
        {/* Conteneur image avec hauteur fixe */}
        <div className="w-full h-36 sm:h-40 md:h-44 lg:h-48 flex items-center justify-center border-gray-600 rounded-md mb-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="object-cover rounded-md h-full lg:w-56 w-fit"
            />
          ) : (
            // Placeholder si pas d'image
            <span className="text-gray-400 text-sm">Pas d'image</span>
          )}
        </div>

        {/* Titre */}
        <h3
          className="md:text-lg text-sm font-light line-clamp-1 mb-1"
          style={{ fontFamily: "Barlow" }}
        >
          {product.title}
        </h3>

        {/* Sélecteur de taille */}
        {taillesDisponibles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {taillesDisponibles.map((taille) => (
              <button
                key={taille}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTaille(taille);
                }}
                className={`px-2 py-1 text-xs rounded border ${selectedTaille === taille
                    ? "bg-[#ffc272] text-black border-[#ffc272]"
                    : "bg-transparent text-white border-gray-600 hover:border-[#ffc272]"
                  }`}
              >
                {taille}
              </button>
            ))}
          </div>
        )}

        {/* Prix */}
        <div className="flex items-center gap-2 mt-auto">
          {discountedPrice ? (
            <>
              <span className="text-[#d6b98d] text-sm font-semibold">
                {discountedPrice} €
              </span>
              <span className="text-gray-500 text-xs line-through">
                {product.price.toFixed(2)} €
              </span>
            </>
          ) : (
            <span className="text-[#d6b98d] text-sm">{product.price} €</span>
          )}
        </div>
      </div>


      {/* Bouton collé en bas */}
      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          className="mt-auto px-3 py-1.5 sm:px-0 sm:py-2 bg-[#ffc272] text-[#111213] text-sm sm:text-small rounded hover:bg-[#e6aa50] transition-colors"
        >
          Ajouter au panier
        </button>
      )}
    </div>
  </div>
  );
}
