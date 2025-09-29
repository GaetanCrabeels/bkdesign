import { Product } from "../types/product";

export interface ProductCardProps {
  product: Product;
  onAdd?: (p: Product) => void;
  onOpen?: () => void;
}

export function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
  return (
    <div
      className="p-4 bg-[#111213] border border-[#2a2b2c] rounded-md shadow hover:shadow-lg transition cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      {/* Conteneur avec aspect-ratio pour image responsive */}
      <div className="relative w-full">
        <img
          src={product.image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="w-full object-cover rounded-md
               h-32 sm:h-40 md:h-44 lg:h-48"
        />
      </div>

      {/* Infos produit */}
      <h3 className="text-base mt-4 font-medium line-clamp-1">{product.title}</h3>
      <p className="text-sm text-[#d6b98d]">{product.price} €</p>

      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          className="mt-2 px-3 py-1.5 sm:px-0 sm:py-2 bg-[#ffc272] text-[#111213] text-sm sm:text-small rounded hover:bg-[#e6aa50] transition-colors"
        >
          Ajouter au panier
        </button>
      )}
    </div>
  );
}
