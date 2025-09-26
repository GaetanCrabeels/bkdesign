// ProductCard.tsx
import { Product } from "../types/product";

export interface ProductCardProps {
  product: Product;
  onAdd?: (p: Product) => void;
  onOpen?: () => void; // ✅ NOUVELLE PROP
}

export function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  return (
    <div
      className="p-4 bg-[#111213] border border-[#2a2b2c] rounded-md shadow hover:shadow-lg transition cursor-pointer"
      onClick={onOpen} // ✅ On déclenche onOpen quand on clique sur la carte
    >
      <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover rounded-md" />
      <h3 className="text-base  mt-4" style={{ fontFamily: "Barlow" }}>{product.title}
      </h3>
      <p className="text-sm text-[#d6b98d]">{product.price} €</p>
      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // ✅ Évite d'ouvrir la modal si on clique sur le bouton
            onAdd(product);
          }}
          className="mt-2 px-4 py-2 bg-[#ffc272] text-[#111213] rounded hover:bg-[#e6aa50]"
        >
          Ajouter au panier
        </button>
      )}
    </div>
  );
}
