import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { supabase } from "../lib/supabaseClient";
import { Header } from "../components/Header";
import { ProductCard } from "../components/ProductCard";
import { AdminProductForm } from "../components/AdminProductForm";
import { useSearchParams, useParams, useNavigate, useLocation } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useCart } from "../components/useCart";
const ProductModal = lazy(() => import("../components/ProductModal"));
const CartModal = lazy(() => import("../components/CartModal"));
export default function Produits() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [userRole, setUserRole] = useState(undefined);
    const [searchParams] = useSearchParams();
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { cart, addToCart, updateCart } = useCart();
    // --- URL → catégories / sous-catégories
    useEffect(() => {
        const catFromQuery = searchParams.get("category");
        const subFromQuery = searchParams.get("subcategory");
        setSelectedCategory(catFromQuery ?? null);
        setSelectedSubcategory(subFromQuery ?? null);
    }, [searchParams]);
    // --- Rôle utilisateur
    useEffect(() => {
        async function fetchUserRole() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user)
                return;
            const userId = userData.user.id;
            const { data, error } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();
            if (!error)
                setUserRole(data?.role);
        }
        fetchUserRole();
    }, []);
    // --- Fetch produits
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
    const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
    const subcategories = useMemo(() => Array.from(new Set(products
        .filter((p) => !selectedCategory || p.category === selectedCategory)
        .map((p) => p.subcategory)
        .filter((s) => s !== undefined))), [products, selectedCategory]);
    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return products.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
            const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
            const matchesSubcategory = selectedSubcategory ? p.subcategory === selectedSubcategory : true;
            const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
            return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice;
        });
    }, [query, products, selectedCategory, selectedSubcategory, priceRange]);
    // 🔹 Modal via URL directe
    useEffect(() => {
        if (params.id && products.length) {
            const prod = products.find(p => p.id === params.id);
            if (prod)
                setSelectedProduct(prod);
        }
    }, [params.id, products]);
    return (_jsxs("div", { className: "min-h-screen bg-[#111213] text-[#ffc272]", children: [_jsx(Header, { cartCount: cart.reduce((s, i) => s + i.qty, 0), onOpenCart: () => setCartOpen(true), query: query, setQuery: setQuery, categories: categories }), _jsxs("div", { className: "max-w-7xl mx-auto border-x-4 border-[#2a2b2c] px-6 py-10", children: [_jsx("h1", { className: "text-4xl text-center mb-4 md:text-7xl", children: "Tous nos produits" }), userRole === "admin" && _jsx(AdminProductForm, { userRole: userRole, onProductsChange: setProducts }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs("aside", { className: "hidden md:block bg-[#1b1c1d] rounded-2xl p-4 space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-6xl mb-5 text-center", children: "Cat\u00E9gories" }), _jsxs("div", { className: "flex flex-col space-y-2", children: [_jsx("button", { className: `text-left px-3 py-2 rounded-xl ${!selectedCategory ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`, onClick: () => { setSelectedCategory(null); navigate("/produits"); }, children: "Toutes" }), categories.map(cat => (_jsx("button", { className: `text-left px-3 py-2 rounded-xl ${selectedCategory === cat ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`, onClick: () => { setSelectedCategory(cat); navigate(`/produits?category=${encodeURIComponent(cat)}`); }, children: cat }, cat)))] })] }), selectedCategory && subcategories.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-4xl mb-5 text-center", children: "Sous-cat\u00E9gories" }), _jsxs("div", { className: "flex flex-col space-y-2", children: [_jsx("button", { className: `text-left px-3 py-2 rounded-xl ${!selectedSubcategory ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`, onClick: () => setSelectedSubcategory(null), children: "Toutes" }), subcategories.map(subcat => (_jsx("button", { className: `text-left px-3 py-2 rounded-xl ${selectedSubcategory === subcat ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`, onClick: () => setSelectedSubcategory(subcat), children: subcat }, subcat)))] })] })), _jsxs("div", { children: [_jsx("h3", { className: "text-3xl mb-2 text-center", children: "Prix" }), _jsx("input", { type: "range", min: 0, max: 1000, value: priceRange[1], onChange: (e) => setPriceRange([0, Number(e.target.value)]), className: "w-full accent-[#ffc272]" }), _jsxs("p", { className: "text-sm text-[#ffc272] text-center", children: ["Jusqu'\u00E0 ", priceRange[1], " \u20AC"] })] })] }), _jsx("main", { className: "md:col-span-3", children: loading ? _jsx("p", { className: "text-center", children: "Chargement..." }) :
                                    filtered.length === 0 ? (_jsx("div", { className: "flex items-center justify-center h-[50vh]", children: _jsx("p", { className: "text-center text-[#ffffff] text-xl font-semibold", children: "Aucun produit trouv\u00E9." }) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: filtered.map((p) => (_jsx(ProductCard, { product: p, onOpen: () => navigate(`/produit/${p.id}`, { state: { background: location } }), onAdd: addToCart }, p.id))) })) })] }), selectedProduct && (_jsx(Suspense, { fallback: null, children: _jsx(ProductModal, { product: selectedProduct, onClose: () => setSelectedProduct(null), onAdd: addToCart }) }))] }), cartOpen && _jsx(CartModal, { items: cart, onClose: () => setCartOpen(false), onUpdateCart: updateCart }), _jsx(Footer, {})] }));
}
