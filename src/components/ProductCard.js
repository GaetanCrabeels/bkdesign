import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
export function ProductCard({ product, onAdd, onOpen }) {
    const [variants, setVariants] = useState([]);
    const [selectedTaille, setSelectedTaille] = useState("");
    const navigate = useNavigate();
    useEffect(() => {
        async function fetchVariants() {
            const { data, error } = await supabase
                .from("product_variants")
                .select("id, produit_id, taille, poids, promotion, quantity, created_at")
                .eq("produit_id", product.id);
            if (!error && data) {
                setVariants(data);
                if (data.length > 0)
                    setSelectedTaille(data[0].taille);
            }
        }
        fetchVariants();
    }, [product.id]);
    const handleOpen = (e) => {
        e.stopPropagation();
        navigate(`/e-shop/produit/${product.id}`, { state: { background: location } });
    };
    const selectedVariant = variants.find(v => v.taille === selectedTaille);
    const promo = selectedVariant?.promotion || 0;
    const discountedPrice = promo > 0 ? +(product.price * (1 - promo / 100)).toFixed(2) : product.price;
    const taillesDisponibles = Array.from(new Set(variants.map(v => v.taille).filter(Boolean)));
    const handleAdd = () => {
        if (!selectedVariant || !onAdd)
            return;
        if (selectedVariant?.quantity !== undefined && selectedVariant.quantity <= 0) {
            alert("Ce produit est en rupture de stock.");
            return;
        }
        const cartItem = {
            id: product.id + "_" + selectedVariant.taille,
            title: product.title,
            price: product.price,
            qty: 1,
            variant: selectedVariant,
        };
        onAdd(cartItem);
    };
    return (_jsxs("div", { children: [promo > 0 && (_jsxs("div", { className: "absolute text-white text-xs sm:text-sm font-bold px-2 py-1 rounded-full shadow-md", style: { background: "linear-gradient(to right, #ef4444, #f97316)" }, children: ["-", promo, "%"] })), _jsxs("div", { className: "p-4 cursor-zoom-in bg-[#111213] border border-[#2a2b2c] rounded-md shadow hover:shadow-lg transition flex flex-col min-h-96", onClick: onOpen, children: [_jsxs("div", { className: "flex-1 flex flex-col h-auto", children: [_jsx("div", { className: "w-full sm:h-40 md:h-44 lg:h-48 flex justify-center items-center border-gray-600 rounded-md mb-4 overflow-hidden", children: product.image_url ? (_jsx("img", { src: product.image_url, alt: product.title, loading: "lazy", decoding: "async", className: "object-contain w-48 h-40 rounded-md" })) : (_jsx("span", { className: "text-gray-400 text-sm", children: "Pas d'image" })) }), _jsx("h3", { className: "text-xs sm:text-base md:text-lg lg:text-2xl font-extralight text-center line-clamp-1 mb-1", style: { fontFamily: "Barlow" }, children: product.title }), taillesDisponibles.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-2 items-center justify-center", children: taillesDisponibles.map(taille => (_jsx("button", { onClick: e => {
                                        e.stopPropagation();
                                        setSelectedTaille(taille);
                                    }, className: `px-2 py-1 mx-x text-xs rounded border ${selectedTaille === taille
                                        ? "bg-[#ffc272] text-black border-[#ffc272]"
                                        : "bg-transparent text-white border-gray-600 hover:border-[#ffc272]"}`, children: taille }, taille))) })), _jsx("div", { className: "flex items-center gap-2 mt-auto justify-center", children: promo > 0 ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-[#d6b98d] text-sm font-semibold", children: [discountedPrice, " \u20AC"] }), _jsxs("span", { className: "text-gray-500 text-xs line-through", children: [product.price.toFixed(2), " \u20AC"] })] })) : (_jsxs("span", { className: "text-[#d6b98d] text-sm", children: [product.price, " \u20AC"] })) })] }), onAdd && (_jsx("button", { disabled: (selectedVariant?.quantity ?? 0) <= 0, className: `mx-auto w-2/3 px-3 py-1.5 sm:px-0 sm:py-2 rounded text-sm lg:text-sm transition-colors ${(selectedVariant?.quantity ?? 0) > 0
                            ? "bg-[#ffc272] text-[#111213] hover:bg-[#e6aa50]"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"}`, onClick: (e) => {
                            e.stopPropagation();
                            if ((selectedVariant?.quantity ?? 0) > 0) {
                                handleAdd();
                            }
                        }, children: (selectedVariant?.quantity ?? 0) > 0 ? "Ajouter au panier" : "Rupture de stock" }))] })] }));
}
