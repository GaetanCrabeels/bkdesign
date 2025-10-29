import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
export default function ProductModal({ product, onClose, onAdd, isProductPage, }) {
    const [qty, setQty] = useState(1);
    const [variants, setVariants] = useState([]);
    const [selectedTaille, setSelectedTaille] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
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
    const selectedVariant = variants.find((v) => v.taille === selectedTaille);
    const stock = selectedVariant?.quantity ?? 0;
    const promo = selectedVariant?.promotion || 0;
    const discountedPrice = promo > 0
        ? (product.price * (1 - promo / 100)).toFixed(2)
        : product.price.toFixed(2);
    const handleClose = () => {
        if (location.state?.background) {
            navigate(-1);
        }
        else {
            navigate(`/produits?category=${encodeURIComponent(product.category)}`);
        }
    };
    const handleAdd = () => {
        if (!selectedVariant)
            return;
        if (stock <= 0) {
            alert("Ce produit est en rupture de stock.");
            return;
        }
        if (qty > stock) {
            alert(`Stock disponible : ${stock}`);
            setQty(stock);
            return;
        }
        const cartItem = {
            id: product.id + "_" + selectedVariant.id,
            title: product.title,
            price: product.price,
            qty,
            variant: selectedVariant,
        };
        onAdd(cartItem);
        handleClose();
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black/50", onClick: handleClose }), _jsxs("div", { className: "relative bg-[#ecddc9] rounded-lg shadow-lg p-6 pt-4 z-10 w-full max-w-md sm:max-w-lg lg:max-w-xl", children: [_jsx("button", { onClick: handleClose, className: "absolute top-2 right-2 text-[#000000] hover:text-white text-2xl", "aria-label": "Fermer", children: "\u2715" }), _jsxs("div", { className: "flex flex-col md:flex-row gap-4 text-justify items-center", children: [_jsx("img", { src: product.image_url, alt: product.title, loading: "eager", decoding: "async", className: "rounded w-auto h-60" }), _jsxs("div", { className: "flex flex-col flex-1 w-full", children: [_jsx("h2", { className: "text-xl sm:text-2xl text-center text-black font-base", style: { fontFamily: "Barlow" }, children: product.title }), product.subcategory && (_jsxs("p", { className: "text-sm text-black italic mt-2 text-center", children: [product.category, " > ", product.subcategory] })), _jsx("p", { className: "mt-3 text-sm sm:text-base", children: product.description }), variants.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-2 mt-3 justify-center", children: variants
                                            .filter((v) => v.taille)
                                            .map((v) => (_jsx("button", { onClick: () => setSelectedTaille(v.taille), className: `px-2 py-1 text-xs sm:text-sm rounded border ${selectedTaille === v.taille
                                                ? "bg-[#ffc272] text-black border-[#ffc272]"
                                                : "bg-transparent text-black border-gray-600 hover:border-[#ffc272]"}`, children: v.taille }, v.id))) })), _jsxs("div", { className: "mt-4 mb-2 text-center text-lg text-black", children: ["Prix : ", _jsxs("span", { className: "font-bold", children: [discountedPrice, " \u20AC"] }), promo > 0 && (_jsxs("span", { className: "line-through text-gray-500 ml-2 text-sm", children: [product.price.toFixed(2), " \u20AC"] }))] }), _jsxs("div", { className: "flex flex-nowrap justify-center items-center gap-2 mt-4 text-black", children: [stock > 0 && (_jsx("input", { value: qty, onChange: (e) => {
                                                    const value = Math.max(1, Number(e.target.value));
                                                    if (value > stock) {
                                                        alert(`Stock disponible : ${stock}`);
                                                        setQty(stock);
                                                    }
                                                    else {
                                                        setQty(value);
                                                    }
                                                }, type: "number", min: 1, max: stock, className: "w-20 sm:w-10 justify-center border rounded text-center" })), _jsx("button", { onClick: handleAdd, disabled: stock <= 0, className: `whitespace-nowrap px-4 py-2 rounded transition-colors text-xs sm:text-base ${stock > 0
                                                    ? "bg-[#ca7322] text-white hover:bg-[#ffc272]"
                                                    : "bg-gray-500 text-gray-300 cursor-not-allowed"}`, children: stock > 0 ? "Ajouter" : "Rupture de stock" }), _jsx("button", { onClick: handleClose, className: "whitespace-nowrap px-4 py-2 bg-[#ca7322] text-white hover:bg-[#ffc272] rounded transition-colors text-xs sm:text-base", children: "Fermer" })] })] })] })] })] }));
}
