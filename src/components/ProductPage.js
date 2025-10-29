import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import ProductModal from "../components/ProductModal";
import { useCart } from "../components/useCart";
export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const { addToCart } = useCart();
    useEffect(() => {
        async function fetchProduct() {
            if (!id)
                return;
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();
            if (!error && data)
                setProduct(data);
        }
        fetchProduct();
    }, [id]);
    if (!product)
        return _jsx("div", { children: "Chargement..." });
    return (_jsx("div", { className: "min-h-screen bg-[#111213] text-[#ffc272]", children: _jsx(ProductModal, { product: product, onClose: () => { }, onAdd: addToCart, isProductPage: true }) }));
}
