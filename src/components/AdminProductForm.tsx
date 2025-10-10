import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product } from "../types/product";

interface AdminProductFormProps {
    userRole: string;
    onProductsChange?: (updatedProducts: ProductWithVariants[]) => void;
}

type Variant = {
    taille: string;
    poids: number;
    promotion: number;
    quantity: number;
};

type VariantField = keyof Variant;

type ProductWithVariants = Product & {
    variants?: Variant[];
};

export function AdminProductForm({ userRole, onProductsChange }: AdminProductFormProps) {
    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
    const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});

    const toggleSubcategory = (key: string) => {
        setOpenSubcategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [formData, setFormData] = useState({
        title: "",
        desc: "",
        cat: "",
        sub: "",
        price: "",
        imageFile: null as File | null,
    });

    const [variants, setVariants] = useState<Variant[]>([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => { fetchProducts(); }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data: productsData } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (!productsData) return setLoading(false);

        const productsWithVariants: ProductWithVariants[] = await Promise.all(
            productsData.map(async (p) => {
                const { data: variantData } = await supabase.from("product_variants").select("*").eq("produit_id", p.id);
                return { ...p, variants: variantData || [] };
            })
        );

        setProducts(productsWithVariants);
        setLoading(false);
    }

    const handleChange = (field: keyof typeof formData, value: string | File | null) => {
        setFormData(f => ({ ...f, [field]: value }));
    };

    const handleVariantChange = (index: number, field: VariantField, value: string) => {
        setVariants(prev => {
            const newVariants = [...prev];
            if (field === "taille") newVariants[index][field] = value;
            else newVariants[index][field] = Number(value);
            return newVariants;
        });
    };

    const addVariant = () => setVariants([...variants, { taille: "", poids: 0, promotion: 0, quantity: 0 }]);
    const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

    const handleEdit = async (p: ProductWithVariants) => {
        setEditingProduct(p);
        setFormData({
            title: p.title,
            desc: p.description || "",
            cat: p.category || "",
            sub: p.subcategory || "",
            price: p.price?.toString() || "",
            imageFile: null,
        });

        const { data: variantData } = await supabase.from("product_variants").select("*").eq("produit_id", p.id);
        setVariants(
            variantData?.map(v => ({
                taille: v.taille || "",
                poids: v.poids || 0,
                promotion: v.promotion || 0,
                quantity: v.quantity || 0
            })) || [{ taille: "", poids: 0, promotion: 0, quantity: 0 }]
        );

        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce produit ?")) return;
        await supabase.from("products").delete().eq("id", id);
        await supabase.from("product_variants").delete().eq("produit_id", id);
        setProducts(products.filter(p => p.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return alert("Titre requis");

        let image_url = editingProduct?.image_url || "";
        if (formData.imageFile) {
            const fileExt = formData.imageFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("BKDesign").upload(fileName, formData.imageFile);
            if (uploadError) return alert("Erreur upload image: " + uploadError.message);
            const { data } = supabase.storage.from("BKDesign").getPublicUrl(fileName);
            image_url = data.publicUrl;
        }

        const productData = {
            title: formData.title,
            description: formData.desc,
            category: formData.cat,
            subcategory: formData.sub,
            price: Number(formData.price),
            image_url
        };

        let productId = editingProduct?.id;

        if (editingProduct) {
            await supabase.from("products").update(productData).eq("id", editingProduct.id);
            await supabase.from("product_variants").delete().eq("produit_id", editingProduct.id);
        } else {
            const { data, error } = await supabase.from("products").insert([productData]).select("id");
            if (error) return alert(error.message);
            productId = data?.[0].id;
        }

        if (productId && variants.length > 0) {
            await supabase.from("product_variants").insert(
                variants.map(v => ({ produit_id: productId, ...v }))
            );
        }

        setEditingProduct(null);
        setFormData({ title: "", desc: "", cat: "", sub: "", price: "", imageFile: null });
        setVariants([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchProducts();
        if (onProductsChange) onProductsChange(products);
    };

    if (userRole !== "admin") return null;

    return (
        <div className="bg-[#1b1c1d] p-4 rounded-2xl mb-6 text-[#ffc272]">
            <button onClick={() => setShowForm(!showForm)} className="bg-[#ffc272] text-[#111213] px-3 py-1 rounded mb-3 hover:bg-[#d9a556]">
                {showForm ? "Masquer admin" : "Afficher admin"}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Champs produit */}
                    <div className="flex flex-wrap gap-3">
                        <input placeholder="Titre" value={formData.title} onChange={e => handleChange("title", e.target.value)} className="w-48 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" />
                        <input placeholder="Catégorie" value={formData.cat} onChange={e => handleChange("cat", e.target.value)} list="categories-list" className="w-48 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" />
                        <datalist id="categories-list">
                            {products.map(p => p.category).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(cat => <option key={cat} value={cat} />)}
                        </datalist>

                        <input placeholder="Sous-catégorie" value={formData.sub} onChange={e => handleChange("sub", e.target.value)} list="subcategories-list" className="w-48 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" />
                        <datalist id="subcategories-list">
                            {products.filter(p => p.category === formData.cat && p.subcategory).map(p => p.subcategory!).filter((v, i, a) => a.indexOf(v) === i).map(sub => <option key={sub} value={sub} />)}
                        </datalist>

                        <input type="number" placeholder="Prix" value={formData.price} onChange={e => handleChange("price", e.target.value)} className="w-24 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" />
                    </div>

                    <textarea placeholder="Description" value={formData.desc} onChange={e => handleChange("desc", e.target.value)} className="w-full p-1 rounded bg-[#2a2b2c] text-[#ffc272]" />

                    <div className=" flex items-center gap-3">
                        <input type="file" ref={fileInputRef} onChange={e => handleChange("imageFile", e.target.files?.[0] || null)} className=" pt-3rounded bg-[#2a2b2c] text-[#ffc272]" />
                        {editingProduct?.image_url && <img src={editingProduct.image_url} alt="preview" className=" mt-4 w-24 h-24 rounded" />}
                    </div>

                    {/* Variantes */}
                    <div className="bg-[#2a2b2c] p-2 rounded mt-2">
                        <h4 className="font-semibold mb-1 text-[#ffc272]">Variantes</h4>
                        {variants.map((v, i) => (
                            <div key={i} className="flex gap-1 mb-1 flex-wrap items-center">
                                <input placeholder="Taille" value={v.taille} onChange={e => handleVariantChange(i, "taille", e.target.value)} className="p-1 rounded w-20 bg-[#1b1c1d] text-[#ffc272]" />
                                <input placeholder="Poids" type="number" value={v.poids} onChange={e => handleVariantChange(i, "poids", e.target.value)} className="p-1 rounded w-20 bg-[#1b1c1d] text-[#ffc272]" />
                                <input placeholder="Promo %" type="number" value={v.promotion} onChange={e => handleVariantChange(i, "promotion", e.target.value)} className="p-1 rounded w-24 bg-[#1b1c1d] text-[#ffc272]" />
                                <input placeholder="Qté" type="number" value={v.quantity} onChange={e => handleVariantChange(i, "quantity", e.target.value)} className="p-1 rounded w-20 bg-[#1b1c1d] text-[#ffc272]" />
                                <button type="button" onClick={() => removeVariant(i)} className="bg-red-600 px-2 rounded text-white">🗑</button>
                            </div>
                        ))}
                        <button type="button" onClick={addVariant} className="bg-[#ffc272] text-[#111213] px-2 py-1 rounded mt-1 hover:bg-[#d9a556]">Ajouter variante</button>
                    </div>

                    <button type="submit" className="bg-[#ffc272] text-[#111213] px-3 py-1 rounded mt-2 hover:bg-[#d9a556]">
                        {editingProduct ? "Modifier le produit" : "Ajouter le produit"}
                    </button>
                </form>
            )}

            <div className="mt-4">
                {loading ? (
                    <p>Chargement...</p>
                ) : showForm && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(
                            products.reduce<Record<string, ProductWithVariants[]>>((acc, p) => {
                                const catKey = p.category || "Sans catégorie";
                                if (!acc[catKey]) acc[catKey] = [];
                                acc[catKey].push(p);
                                return acc;
                            }, {})
                        ).map(([category, catProducts]) => (
                            <div key={category} className="bg-[#2a2b2c] p-3 rounded-2xl shadow">
                                <h2 className="text-lg font-bold mb-2 text-[#ffc272]" style={{ fontFamily: "Barlow" }}>
                                    {category}
                                </h2>

                                {Object.entries(
                                    catProducts.reduce<Record<string, ProductWithVariants[]>>((acc, p) => {
                                        const subKey = p.subcategory || "Sans sous-catégorie";
                                        if (!acc[subKey]) acc[subKey] = [];
                                        acc[subKey].push(p);
                                        return acc;
                                    }, {})
                                ).map(([subcategory, subProducts]) => (
                                    <div key={subcategory} className="mb-2">
                                        {subcategory !== "Sans sous-catégorie" && (
                                            <button
                                                onClick={() => toggleSubcategory(subcategory)}
                                                className="w-full text-left text-sm font-semibold mb-1 text-[#ffc272] px-2 py-1 rounded hover:bg-[#1b1c1d]"
                                            >
                                                {subcategory} {openSubcategories[subcategory] ? "▼" : "►"}
                                            </button>
                                        )}

                                        {openSubcategories[subcategory] && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                                {subProducts.map(p => (
                                                    <div key={p.id} className="bg-[#1b1c1d] p-2 rounded-xl shadow flex flex-col">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <h4 className="text-sm font-semibold">{p.title}</h4>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleEdit(p)} className="bg-blue-600 px-1 py-0.5 rounded hover:bg-blue-500 text-white text-xs">✎</button>
                                                                <button onClick={() => handleDelete(p.id)} className="bg-red-600 px-1 py-0.5 rounded hover:bg-red-500 text-white text-xs">🗑</button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-[#ffc272]/80 mb-1">Prix: €{p.price}</p>
                                                        {p.variants?.length! > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {p.variants!.map((v, idx) => (
                                                                    <span key={idx} className="text-[10px] bg-[#ffc272]/20 text-[#ffc272] px-1 py-0.5 rounded">
                                                                        {v.taille} / {v.poids}kg / {v.quantity}pcs / {v.promotion}%
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
