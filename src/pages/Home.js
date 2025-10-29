import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Header } from "../components/Header";
import { AutoCarousel } from "../components/Carousel";
import { Footer } from "../components/Footer";
import { useCart } from "../components/useCart";
import { supabase } from "../lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
const ProductModal = lazy(() => import("../components/ProductModal"));
const CartModal = lazy(() => import("../components/CartModal"));
const ProductCarousel = lazy(() => import("../components/ProductCarousel"));
export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);
    const { cart, addToCart, updateCart } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    // 🔹 Fetch produits
    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("is_hidden", false);
            if (!error)
                setProducts(data || []);
            else
                console.error(error);
            setLoading(false);
        }
        fetchProducts();
    }, []);
    // 🔹 Filtrage
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return products;
        return products.filter(p => p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q));
    }, [query, products]);
    const categories = Array.from(new Set(filtered.map(p => p.category))).sort();
    // 🔹 Modal via URL directe
    useEffect(() => {
        const match = location.pathname.match(/\/e-shop\/produit\/(.+)/);
        if (match && products.length) {
            const prod = products.find(p => p.id === match[1]);
            if (prod)
                setSelectedProduct(prod);
        }
    }, [location.pathname, products]);
    return (_jsxs("div", { className: "min-h-screen bg-[#111213] text-[#ffc272]", children: [_jsx(Header, { cartCount: cart.reduce((s, i) => s + i.qty, 0), onOpenCart: () => setCartOpen(true), query: query, setQuery: setQuery, categories: categories }), _jsxs("div", { className: "max-w-7xl mx-auto border-x-2 border-[#2a2b2c]", children: [_jsxs("section", { className: "w-full flex flex-col items-center text-center py-10 sm:py-12", children: [_jsx("h1", { className: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#ffc272] drop-shadow-lg mb-6 sm:mb-8", children: "Bienvenue dans notre e-Shop" }), _jsx("p", { className: "text-xl sm:text-2xl md:text-3xl font-semibold text-[#ffc272] mb-6", children: "CONCEPT STORE D\u00C9CO, MODE & \u00C9NERGIE" }), _jsx("p", { className: "max-w-4xl text-base sm:text-lg md:text-xl leading-relaxed text-[#d6b98d] mb-4 mx-4 text-justify", children: "D\u00E9couvrez un univers unique o\u00F9 se rencontrent :" }), _jsxs("ul", { className: "max-w-4xl text-base sm:text-lg md:text-xl leading-relaxed text-[#d6b98d] mb-4 mx-4 text-left list-disc list-inside space-y-2", children: [_jsx("li", { children: "D\u00E9coration int\u00E9rieure : cadres, vases, fleurs artificielles, objets design..." }), _jsx("li", { children: "Pierres naturelles & bijoux \u00E9nerg\u00E9tiques : min\u00E9raux, bijoux, encens, spiritualit\u00E9..." }), _jsx("li", { children: "Mode chic : vestes en fausse fourrure & accessoires tendance." })] }), _jsx("p", { className: "max-w-4xl text-base sm:text- md:text-xl leading-relaxed text-[#d6b98d] mb-6 mx-4 text-justify", children: "Un lieu moderne, inspirant et raffin\u00E9 pour sublimer votre int\u00E9rieur, votre style et votre \u00E9nergie." }), _jsx("p", { className: "max-w-4xl sm:text-lg leading-relaxed text-[#d6b98d] mb-6 mx-4 text-center font-semibold", children: "MONS - RUE DES FRIPIERS 22B" }), _jsx("div", { className: "w-full max-w-5xl min-h-5 overflow-hidden rounded-xl mb-0", children: _jsx(AutoCarousel, {}) })] }), _jsxs("main", { className: "px-4 py-8 sm:py-16 space-y-12", children: [loading && _jsx("div", { children: "Chargement..." }), !loading && categories.map(cat => {
                                const productsInCat = filtered.filter(p => p.category === cat);
                                if (!productsInCat.length)
                                    return null;
                                return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-3xl sm:text-4xl md:text-6xl text-center mb-10", children: cat }), _jsx(Suspense, { fallback: _jsx("div", { className: "h-64 bg-[#1b1c1d] animate-pulse rounded-xl" }), children: _jsx(ProductCarousel, { products: productsInCat, onOpen: p => navigate(`/produit/${p.id}`, { state: { background: location } }), onAdd: addToCart }) })] }, cat));
                            }), !loading && filtered.length === 0 && _jsx("p", { className: "text-center text-[#d6b98d]", children: "Aucun produit trouv\u00E9." })] })] }), selectedProduct && (_jsx(Suspense, { fallback: null, children: _jsx(ProductModal, { product: selectedProduct, onClose: () => setSelectedProduct(null), onAdd: addToCart }) })), cartOpen && (_jsx(Suspense, { fallback: null, children: _jsx(CartModal, { items: cart, onClose: () => setCartOpen(false), onUpdateCart: updateCart }) })), _jsx(Footer, {})] }));
}
