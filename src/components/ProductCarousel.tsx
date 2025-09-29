import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "../types/product";
import { ProductCard } from "./ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useId } from "react";

import "swiper/css";
import "swiper/css/navigation";

interface ProductCarouselProps {
  products: Product[];
  onOpen: (p: Product) => void;
  onAdd: (p: Product) => void;
}

export default function ProductCarousel({ products, onOpen, onAdd }: ProductCarouselProps) {
  // Génère un identifiant unique pour ce carrousel
  const id = useId();
  const prevClass = `custom-prev-${id}`;
  const nextClass = `custom-next-${id}`;

  return (
    <section className="relative w-full">
      <div className="max-w-7xl mx-auto  px-4 sm:px-6 w-[95vw] lg:px-8">
        <Swiper
          modules={[Navigation]}
          spaceBetween={16}
          navigation={{
            nextEl: `.${nextClass}`,
            prevEl: `.${prevClass}`,
          }}
          breakpoints={{
            320: { slidesPerView: 2 },
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 },
          }}
          style={{ paddingBottom: "1rem" }}
        >
          {products.map((product, i) => (
            <SwiperSlide
              key={product.id ?? i}
              className="flex justify-center items-stretch"
            >
              <div className="w-full h-full">
                <ProductCard
                  product={product}
                  onOpen={() => onOpen(product)}
                  onAdd={onAdd}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Flèches avec classes uniques */}
        <button
          className={`${prevClass} absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-[#ffc272] text-[#111213] shadow-lg hover:bg-[#e6aa50] transition-colors`}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          className={`${nextClass} absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-[#ffc272] text-[#111213] shadow-lg hover:bg-[#e6aa50] transition-colors`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
