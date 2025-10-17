import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product, CartItem } from "../types/product";
import { useNavigate } from "react-router-dom";

export interface ProductCardProps {
  product: Product;
  onAdd?: (item: CartItem) => void; // CartItem complet avec variant
  onOpen?: () => void;
}

export interface ProductVariant {
  id: string;
  produit_id: string;
  taille: string;
  poids: number;
  promotion: number;
  quantity: number;
  created_at?: string;
}

export function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedTaille, setSelectedTaille] = useState<string>("");
  const navigate = useNavigate();

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
  const handleOpen = (e: React.MouseEvent) => {
  e.stopPropagation();
  navigate(`/e-shop/produit/${product.id}`, { state: { background: location } });
};


  const selectedVariant = variants.find(v => v.taille === selectedTaille);
  const promo = selectedVariant?.promotion || 0;
  const discountedPrice = promo > 0 ? +(product.price * (1 - promo / 100)).toFixed(2) : product.price;

  const taillesDisponibles = Array.from(new Set(variants.map(v => v.taille).filter(Boolean)));

  const handleAdd = () => {
    if (!selectedVariant || !onAdd) return;

    const cartItem: CartItem = {
      id: product.id + "_" + selectedVariant.taille, // unique par variante
      title: product.title,
      price: product.price,
      qty: 1,
      variant: selectedVariant,
    };

    onAdd(cartItem);
  };

  return (

    <div>

      {promo > 0 && (
        <div
          className="absolute text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-full shadow-md"
          style={{ background: "linear-gradient(to right, #ef4444, #f97316)" }}
        >
          -{promo}%
        </div>
      )}
      <div
        className="p-4 cursor-zoom-in bg-[#111213] border border-[#2a2b2c] rounded-md shadow hover:shadow-lg transition flex flex-col sm:h-auto lg:min-h-96"
        onClick={onOpen}
      >

        <div className="flex-1 flex flex-col h-auto">
          
          <div className="w-full sm:h-40 md:h-44 lg:h-48 flex justify-center items-center border-gray-600 rounded-md mb-4 overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                loading="lazy"
                decoding="async"
                className="object-contain w-full h-full rounded-md"
              />
            ) : (
              <span className="text-gray-400 text-sm">Pas d'image</span>
            )}
          </div>

          <h3
            className="text-xs sm:text-base md:text-lg lg:text-2xl font-extralight text-center line-clamp-1 mb-1"
            style={{ fontFamily: "Barlow" }}
          >
            {product.title}
          </h3>


          {taillesDisponibles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 items-center justify-center">
              {taillesDisponibles.map(taille => (
                <button
                  key={taille}
                  onClick={e => {
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

          <div className="flex items-center gap-2 mt-auto justify-center">
            {promo > 0 ? (
              <>
                <span className="text-[#d6b98d] text-sm font-semibold">{discountedPrice} €</span>
                <span className="text-gray-500 text-xs line-through">{product.price.toFixed(2)} €</span>
              </>
            ) : (
              <span className="text-[#d6b98d] text-sm">{product.price} €</span>
            )}
          </div>
        </div>
        

        {onAdd && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleAdd();
            }}
            className="mx-auto  flex justify-center items-center w-2/3 px-3 py-1.5 sm:px-0 sm:py-2 bg-[#ffc272] text-[#111213] text-sm lg:text-sm rounded hover:bg-[#e6aa50] transition-colors"
          >
            Ajouter au panier
          </button>
          
        )}
        
      </div>
    </div>
  );
}
