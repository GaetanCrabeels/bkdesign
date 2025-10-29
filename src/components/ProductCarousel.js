import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useId } from "react";
import "swiper/css";
import "swiper/css/navigation";
export default function ProductCarousel({ products, onOpen, onAdd }) {
    // Génère un identifiant unique pour ce carrousel
    const id = useId();
    const prevClass = `custom-prev-${id}`;
    const nextClass = `custom-next-${id}`;
    return (_jsx("section", { className: "relative", children: _jsxs("div", { className: "max-w-7xl mx-auto ", children: [_jsx(Swiper, { modules: [Navigation], spaceBetween: 16, navigation: {
                        nextEl: `.${nextClass}`,
                        prevEl: `.${prevClass}`,
                    }, breakpoints: {
                        320: { slidesPerView: 2 },
                        640: { slidesPerView: 3 },
                        1024: { slidesPerView: 4 },
                        1280: { slidesPerView: 5 },
                    }, style: { paddingBottom: "1rem" }, children: products.map((product, i) => (_jsx(SwiperSlide, { className: "flex justify-center items-stretch", children: _jsx("div", { className: "w-full h-full", children: _jsx(ProductCard, { product: product, onOpen: () => onOpen(product), onAdd: onAdd }) }) }, product.id ?? i))) }), _jsx("button", { className: `${prevClass} absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-[#ffc272] text-[#111213] shadow-lg hover:bg-[#e6aa50] transition-colors`, children: _jsx(ChevronLeft, { size: 20 }) }), _jsx("button", { className: `${nextClass} absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-[#ffc272] text-[#111213] shadow-lg hover:bg-[#e6aa50] transition-colors`, children: _jsx(ChevronRight, { size: 20 }) })] }) }));
}
