import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Product } from "../types/product";
import ProductModal from "../components/ProductModal";
import { useCart } from "../components/useCart";

export default function ProductPage() {
    const { id } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const { addToCart } = useCart();

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .single();

            if (!error && data) setProduct(data);
        }
        fetchProduct();
    }, [id]);

    if (!product) return <div>Chargement...</div>;

    return (
        <div className="min-h-screen bg-[#111213] text-[#ffc272]">
            <ProductModal
                product={product}
                onClose={() => { }}
                onAdd={addToCart}
                isProductPage={true}
            />
        </div>
    );
}
