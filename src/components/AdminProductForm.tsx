import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product } from "../types/product";

interface AdminProductFormProps {
    userRole: string;
    onProductsChange?: (updatedProducts: Product[]) => void;
}

export function AdminProductForm({ userRole, onProductsChange }: AdminProductFormProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(true);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [total_quantity, settotal_quantity] = useState<number>(0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [imageUrl, setImageUrl] = useState<string>("");


    const [variants, setVariants] = useState<{ taille: string; poids: number; promotion: number }[]>([
        { taille: "", poids: 0, promotion: 0 }
    ]);

    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<{ category: string; subcategory: string }[]>([]);

    useEffect(() => { fetchProducts(); }, []);

    async function fetchProducts(): Promise<Product[]> {
        setLoading(true);
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (error) console.error("Erreur fetch produits:", error);
        else {
            setProducts(data || []);
            const categories = Array.from(new Set((data || []).map(p => p.category).filter(Boolean)));
            setAllCategories(categories);

            const subcats = (data || [])
                .filter(p => p.subcategory)
                .map(p => ({ category: p.category, subcategory: p.subcategory }));
            const uniqueSubcats = subcats.filter(
                (v, i, a) => a.findIndex(t => t.category === v.category && t.subcategory === v.subcategory) === i
            );
            setAllSubcategories(uniqueSubcats);
        }
        setLoading(false);
        return data || [];
    }

    const filteredSubcategories = allSubcategories.filter(s => s.category === category).map(s => s.subcategory);

    const handleAddVariant = () => setVariants([...variants, { taille: "", poids: 0, promotion: 0 }]);
    const handleRemoveVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return alert("Le titre est obligatoire.");

        let image_url = imageUrl; // par défaut, l'ancienne image
        if (imageFile) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("BKDesign").upload(fileName, imageFile);
            if (uploadError) return alert("Erreur upload image: " + uploadError.message);
            const { data } = supabase.storage.from("BKDesign").getPublicUrl(fileName);
            image_url = data.publicUrl;
        }

        const productData = { title, description, category, subcategory, price, total_quantity, image_url };
        let productId = editingProductId;

        if (editingProductId) {
            // Mise à jour produit
            const { error } = await supabase.from("products").update(productData).eq("id", editingProductId);
            if (error) return alert(error.message);
            alert("Produit modifié !");

            // Supprimer anciennes variantes
            await supabase.from("product_variants").delete().eq("produit_id", editingProductId);

            // Ajouter variantes actuelles avec promotion
            if (variants.length > 0) {
                const variantsData = variants.map(v => ({
                    produit_id: editingProductId,
                    taille: v.taille,
                    poids: v.poids,
                    promotion: v.promotion
                }));
                const { error: variantsError } = await supabase.from("product_variants").insert(variantsData);
                if (variantsError) console.error("Erreur ajout variantes :", variantsError.message);
            }
        } else {
            // Nouveau produit
            const { data, error } = await supabase.from("products").insert([productData]).select("id");
            if (error) return alert(error.message);

            productId = data?.[0].id;
            alert("Produit ajouté !");

            if (productId && variants.length > 0) {
                const variantsData = variants.map(v => ({
                    produit_id: productId,
                    taille: v.taille,
                    poids: v.poids,
                    promotion: v.promotion
                }));
                const { error: variantsError } = await supabase.from("product_variants").insert(variantsData);
                if (variantsError) console.error("Erreur ajout variantes :", variantsError.message);
            }
        }

        // Reset
        setTitle(""); setDescription(""); setCategory(""); setSubcategory(""); setPrice(0);
        settotal_quantity(0); setVariants([]); setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setEditingProductId(null);

        const data = await fetchProducts();
        if (onProductsChange) onProductsChange(data);
    };

    const handleEdit = async (product: Product) => {
        setImageUrl(product.image_url || "");

        setEditingProductId(product.id);
        setTitle(product.title);
        setDescription(product.description || "");
        setCategory(product.category || "");
        setSubcategory(product.subcategory || "");
        setPrice(product.price || 0);
        settotal_quantity(product.total_quantity || 0);

        const { data, error } = await supabase.from("product_variants").select("*").eq("produit_id", product.id);
        if (!error && data) setVariants(data.map(v => ({ taille: v.taille, poids: v.poids, promotion: v.promotion })));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
        await supabase.from("products").delete().eq("id", id);
        await supabase.from("product_variants").delete().eq("produit_id", id);
        setProducts(products.filter(p => p.id !== id));
    };

    if (userRole !== "admin") return null;

    return (
        <div className="bg-[#1b1c1d] p-6 rounded-xl mb-8">
            <button onClick={() => setShowForm(prev => !prev)} className="mb-4 px-3 py-1 rounded bg-[#ffc272] text-black hover:bg-gray-600">
                {showForm ? "Réduire l'interface admin" : "Afficher l'interface admin"}
            </button>

            {showForm && (
                <div className="transition-all duration-300 ease-in-out">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Catégorie + Sous-catégorie avec saisie libre */}
                        <div className="mx-auto ">
                            <div className="mb-4">Titre</div>

                        <textarea placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} className="mb-4  p-2 rounded bg-gray-800 text-white resize-none" />
                        

                            {/* Catégorie */}
                            <div className="relative col-span-2  mb-4">
                                <input
                                    list="categories-list"
                                    value={category}
                                    onChange={(e) => {
                                        setCategory(e.target.value);
                                        setSubcategory("");
                                    }}
                                    placeholder="Catégorie (nouvelle ou existante)"
                                    className="p-2 rounded bg-gray-800 text-white "
                                />
                                <datalist id="categories-list">
                                    {allCategories.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>

                            {/* Sous-catégorie */}
                            {category && (
                                <div className="relative col-span-2">
                                    <input
                                        list="subcategories-list"
                                        value={subcategory}
                                        onChange={(e) => setSubcategory(e.target.value)}
                                        placeholder="Sous-catégorie (nouvelle ou existante)"
                                        className="p-2 rounded bg-gray-800 text-white mb-4"
                                    />
                                    <datalist id="subcategories-list">
                                        {filteredSubcategories.map((sub) => (
                                            <option key={sub} value={sub} />
                                        ))}
                                    </datalist>
                                </div>
                            )}


                            <div className="">
                                <div className="mb-4">Prix en €</div>
                                <input type="number" placeholder="Prix (€)" onChange={e => setPrice(Number(e.target.value))} className=" mb-4 p-2 rounded bg-gray-800 text-white w-32" />
                                <div className="mb-4">Quantité par taille</div>
                                <input type="number" placeholder="total_quantity" value={total_quantity} onChange={e => settotal_quantity(Number(e.target.value))} className=" mb-4 p-2 rounded bg-gray-800 text-white w-32" />
                            </div>
                            <div className="mb-4">Description</div>

                            <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="min-w-96 h-32 p-2 rounded bg-gray-800 text-white resize-none" />
                            {imageUrl && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-400 mb-1">Image actuelle :</p>
                                    <img
                                        src={imageUrl}
                                        alt="Aperçu du produit"
                                        className="w-32 h-32 object-cover rounded border border-gray-600"
                                    />
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className=" p-2 rounded bg-gray-800 text-white" />

                        {/* Variantes */}
                        <div className="mt-4 ">
                            <h4 className="text-white mb-2">Taille / Poids / Promotion</h4>
                            {variants.map((v, i) => (
                                <div key={i} className="flex flex-wrap gap-2 mb-2 items-center">
                                    {/* Taille */}
                                    <input
                                        value={v.taille || ""}
                                        onChange={(e) => {
                                            const nv = [...variants];
                                            nv[i].taille = e.target.value;
                                            setVariants(nv);
                                        }}
                                        className="p-2 rounded bg-gray-800 text-white w-32 placeholder-gray-400"
                                        placeholder="Taille en cm"
                                    />

                                    {/* Poids */}
                                    <input
                                        value={v.poids === 0 ? "" : v.poids}
                                        type="number"
                                        onChange={(e) => {
                                            const nv = [...variants];
                                            nv[i].poids = Number(e.target.value);
                                            setVariants(nv);
                                        }}
                                        className="p-2 rounded bg-gray-800 text-white w-40 placeholder-gray-400"
                                        placeholder="Poids (En gramme)"
                                    />

                                    {/* Promotion */}
                                    <input
                                        value={v.promotion === 0 ? "" : v.promotion}
                                        type="number"
                                        onChange={(e) => {
                                            const nv = [...variants];
                                            nv[i].promotion = Number(e.target.value);
                                            setVariants(nv);
                                        }}
                                        className="p-2 rounded bg-gray-800 text-white w-40 placeholder-gray-400"
                                        placeholder="Promotion (%)"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(i)}
                                        className="bg-red-600 px-2 py-1 rounded text-white"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}


                            <button type="button" onClick={handleAddVariant} className="bg-[#ffc272] px-3 py-1 rounded text-black">Ajouter une ligne Taille/Poids/Promotion</button>
                        </div>

                        <button type="submit" className="bg-[#ffc272] text-black px-4 py-2 rounded hover:bg-[#d9a556] mt-4">
                            {editingProductId ? "Modifier" : "Ajouter le produit"}
                        </button>
                    </form>

                    {/* Liste produits */}
                    <div className="mt-6 space-y-2">
                        {loading ? <p>Chargement...</p> : products.map(p => (
                            <div key={p.id} className="flex flex-wrap items-center bg-gray-800 p-2 rounded">
                                <span className="flex-1">{p.title}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(p)} className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500">Modifier</button>
                                    <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-600 rounded hover:bg-red-500">Supprimer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
