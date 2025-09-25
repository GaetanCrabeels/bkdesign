import { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
  onOpen: () => void;
  onAdd: (p: Product, qty?: number, color?: string) => void;
}

export function ProductCard({ product, onOpen, onAdd }: ProductCardProps) {
  return (
    <div className="bg-[#ecd187] rounded-lg shadow-card p-4 flex flex-col mt-4 mb-4">
      <img
        src={product.image}
        alt={product.title}
        className="h-48 w-full object-cover rounded mb-4"
      />
      <h4 className="text-xl text-[#9f6a23] mb-1">{product.title}</h4>
      <p className="text-body text-accent text-[#9f6a23] text-base">{product.description.slice(0.80)}...</p>
      <div className="flex items-center justify-between mt-auto">
        <span className="font-bold text-[#9f6a23] ml-2 text-lg">€{product.price}</span>
        <button
          onClick={() => onAdd(product,1,product.colors[0])}
          className=" bg-[#9f6a23] text-white px-3 py-1 rounded hover:bg-accent transition-colors"
        >
          + Ajouter
        </button>
      </div>
    </div>

  );
}
