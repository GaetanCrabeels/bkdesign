import { useState, useEffect } from "react";
import { Product, CartItem } from "../types/product";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
  isProductPage?: boolean;
}

interface ProductVariant {
  id: string;
  produit_id: string;
  taille: string;
  poids: number;
  promotion: number;
  quantity: number;
  created_at?: string;
}

export default function ProductModal({
  product,
  onClose,
  onAdd,
  isProductPage,
}: ProductModalProps) {
  const [qty, setQty] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedTaille, setSelectedTaille] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchVariants() {
      const { data, error } = await supabase
        .from("product_variants")
        .select(
          "id, produit_id, taille, poids, promotion, quantity, created_at"
        )
        .eq("produit_id", product.id);

      if (!error && data) {
        setVariants(data);
        if (data.length > 0) setSelectedTaille(data[0].taille);
      }
    }
    fetchVariants();
  }, [product.id]);

  const selectedVariant = variants.find((v) => v.taille === selectedTaille);
  const stock = selectedVariant?.quantity ?? 0;

  const promo = selectedVariant?.promotion || 0;
  const discountedPrice =
    promo > 0
      ? (product.price * (1 - promo / 100)).toFixed(2)
      : product.price.toFixed(2);

  const handleClose = () => {
    if (location.state?.background) {
      navigate(-1);
    } else {
      navigate(`/produits?category=${encodeURIComponent(product.category)}`);
    }
  };

  const handleAdd = () => {
    if (!selectedVariant) return;

    if (stock <= 0) {
      alert("Ce produit est en rupture de stock.");
      return;
    }

    if (qty > stock) {
      alert(`Stock disponible : ${stock}`);
      setQty(stock);
      return;
    }

    const cartItem: CartItem = {
      id: product.id + "_" + selectedVariant.id,
      title: product.title,
      price: product.price,
      qty,
      variant: selectedVariant,
    };

    onAdd(cartItem);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-[#ecddc9] rounded-lg shadow-lg p-6 pt-4 z-10 w-full max-w-md sm:max-w-lg lg:max-w-xl">
        {/* Bouton fermer */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-[#000000] hover:text-white text-2xl"
          aria-label="Fermer"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row gap-4 text-justify items-center">
          {/* Image */}
          <img
            src={product.image_url}
            alt={product.title}
            loading="eager"
            decoding="async"
            className="rounded w-auto h-60"
          />

          {/* Infos produit */}
          <div className="flex flex-col flex-1 w-full">
            <h2
              className="text-xl sm:text-2xl text-center text-black font-base"
              style={{ fontFamily: "Barlow" }}
            >
              {product.title}
            </h2>

            {product.subcategory && (
              <p className="text-sm text-black italic mt-2 text-center">
                {product.category} &gt; {product.subcategory}
              </p>
            )}

            <p className="mt-3 text-sm sm:text-base">{product.description}</p>

            {/* Sélecteur de taille */}
            {variants.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 mt-3 justify-center">
                {variants
                  .filter((v) => v.taille)
                  .map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedTaille(v.taille)}
                      className={`px-2 py-1 text-xs sm:text-sm rounded border ${selectedTaille === v.taille
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
            <div className="mt-4 mb-2 text-center text-lg text-black">
              Prix : <span className="font-bold">{discountedPrice} €</span>
              {promo > 0 && (
                <span className="line-through text-gray-500 ml-2 text-sm">
                  {product.price.toFixed(2)} €
                </span>
              )}
            </div>

            {/* Quantité + boutons */}
            <div className="flex flex-nowrap justify-center items-center gap-2 mt-4 text-black">
              {stock > 0 && (
                <input
                  value={qty}
                  onChange={(e) => {
                    const value = Math.max(1, Number(e.target.value));
                    if (value > stock) {
                      alert(`Stock disponible : ${stock}`);
                      setQty(stock);
                    } else {
                      setQty(value);
                    }
                  }}
                  type="number"
                  min={1}
                  max={stock}
                  className="w-20 sm:w-10 justify-center border rounded text-center"
                />
              )}

              <button
                onClick={handleAdd}
                disabled={stock <= 0}
                className={`whitespace-nowrap px-4 py-2 rounded transition-colors text-xs sm:text-base ${stock > 0
                    ? "bg-[#ca7322] text-white hover:bg-[#ffc272]"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                  }`}
              >
                {stock > 0 ? "Ajouter" : "Rupture de stock"}
              </button>

              <button
                onClick={handleClose}
                className="whitespace-nowrap px-4 py-2 bg-[#ca7322] text-white hover:bg-[#ffc272] rounded transition-colors text-xs sm:text-base"
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
