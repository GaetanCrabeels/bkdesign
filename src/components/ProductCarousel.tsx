import { useState, useEffect } from "react";
import { Product } from "../types/product";
import { ProductCard } from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
    products: Product[];
    onOpen: (p: Product) => void;
    onAdd: (p: Product) => void;
}

export function ProductCarousel({ products, onOpen, onAdd }: ProductCarouselProps) {
    const visibleCount = 5;
    const [index, setIndex] = useState(0);

    const maxIndex = Math.max(products.length - visibleCount, 0);
    const isAtStart = index === 0;
    const isAtEnd = index === maxIndex;

    // Si moins de 5 éléments → bloquer à 0
    useEffect(() => {
        if (products.length <= visibleCount && index !== 0) {
            setIndex(0);
        }
    }, [products.length, index, visibleCount]);

    return (
        <div className="relative max-w-7xl mx-auto mt-8 overflow-hidden">
            {/* Flèche gauche */}
            {products.length > visibleCount && (
                <button
                    onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={isAtStart}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full shadow-lg 
            ${isAtStart ? "bg-[#ffc272] text-[#111213] cursor-not-allowed" : "bg-[#ffc272] hover:bg-[#ffc272] text-[#111213]"}`}
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Container des produits */}
            <div
                className="flex text-center transition-transform duration-500 ease-in-out"
                style={{
                    transform: `translateX(-${(index * 100) / visibleCount}%)`,
                    maxWidth: `${(110)}%`,
                     maxHeight: `${100 / visibleCount}%`,
                }}
            >
                {products.map((product, i) => (
                    <div
                        key={product.id ?? i}
                        className="px-2"
                        style={{
                            maxHeight: `${100 / visibleCount}%`,
                            flex: `0 0 ${100}%`,
                            maxWidth: `${100 / visibleCount}%`,
                        }}
                    >
                        <ProductCard
                            product={product}
                            onOpen={() => onOpen(product)}
                            onAdd={onAdd}
                        />
                    </div>
                ))}
            </div>

            {/* Flèche droite */}
            {products.length > visibleCount && (
                <button
                    onClick={() => setIndex((prev) => Math.min(prev + 1, maxIndex))}
                    disabled={isAtEnd}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full shadow-lg 
            ${isAtEnd ? "bg-[#ffc272] text-[#111213] cursor-not-allowed" : "bg-[#ffc272] hover:bg-[#ffc272] text-[#111213]"}`}
                >
                    <ChevronRight size={24} />
                </button>
            )}
        </div>
    );
}
