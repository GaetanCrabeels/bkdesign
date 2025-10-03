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
    const [showForm, setShowForm] = useState(true); // contrôle affichage bloc admin

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<string>(""); // string pour permettre champ vide
    const [category, setCategory] = useState<string>("");
    const [subcategory, setSubcategory] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null); // <-- ref pour vider le fichier

    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<string[]>([]);

    // Fetch products
    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Erreur fetch produits:", error);
        else {
            setProducts(data || []);
            const categories = Array.from(new Set((data || []).map(p => p.category).filter(Boolean)));
            setAllCategories(categories);

            const subcategories = Array.from(new Set((data || []).map(p => p.subcategory).filter(Boolean)));
            setAllSubcategories(subcategories);
        }
        setLoading(false);
        return data || [];
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !price) return alert("Le titre et le prix sont obligatoires.");

        let image_url = "";
        if (imageFile) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = fileName;

            const { error: uploadError } = await supabase.storage
                .from("BKDesign")
                .upload(filePath, imageFile);

            if (uploadError) return alert("Erreur upload image: " + uploadError.message);

            const { data } = supabase.storage.from("BKDesign").getPublicUrl(filePath);
            image_url = data.publicUrl;
        }

        const productData = {
            title,
            description,
            price: Number(price),
            category,
            subcategory,
            image_url,
        };

        if (editingProductId) {
            const { error } = await supabase.from("products").update(productData).eq("id", editingProductId);
            if (error) return alert("Erreur modification: " + error.message);
            alert("Produit modifié !");
            setEditingProductId(null);
        } else {
            const { error } = await supabase.from("products").insert([productData]);
            if (error) return alert("Erreur ajout: " + error.message);
            alert("Produit ajouté !");
        }

        // Reset form
        setTitle("");
        setDescription("");
        setPrice("");
        setCategory("");
        setSubcategory("");
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        const updatedProducts = await fetchProducts();
        if (onProductsChange) onProductsChange(updatedProducts);
    };

    const handleEdit = (product: Product) => {
        setEditingProductId(product.id);
        setTitle(product.title);
        setDescription(product.description || "");
        setPrice(product.price.toString());
        setCategory(product.category || "");
        setSubcategory(product.subcategory || "");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) return alert("Erreur suppression: " + error.message);
        setProducts(products.filter(p => p.id !== id));
    };

    // Filtrer les sous-catégories selon la catégorie sélectionnée
    const filteredSubcategories = allSubcategories.filter(sub => {
        const productWithSub = products.find(p => p.subcategory === sub);
        return productWithSub?.category === category;
    });

    if (userRole !== "admin") return null;

    return (
        <div className="bg-[#1b1c1d] p-6 rounded-xl mb-8">
            {/* Bouton toggle pour tout le bloc admin */}
            <button
                onClick={() => setShowForm(prev => !prev)}
                className="mb-4 px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
                {showForm ? "Réduire l'interface admin" : "Afficher l'interface admin"}
            </button>

            {/* Bloc admin complet */}
            {showForm && (
                <div className="transition-all duration-300 ease-in-out">
                    {/* Formulaire */}
                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <div className="flex flex-col sm:flex-row sm:space-x-4 items-start">
                            <input
                                type="text"
                                placeholder="Titre"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="m-4 ml-0 w-20% p-1 rounded bg-gray-800 text-white"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Prix"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="w-[120px] m-4 ml-0 h-auto p-1 rounded bg-gray-800 text-white"
                                required
                            />
                        </div>

                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full lg:w-[40vw] lg:h-[10vw] md:h-[20vw] h-[50vw] p-1 rounded bg-gray-800 text-white resize-none"
                            required
                        />

                        <div className="flex flex-col sm:flex-row sm:space-x-4 items-start">
                            <div className="flex-1">
                                <input
                                    list="categories"
                                    placeholder="Catégorie"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-40% mr-6 p-2 rounded bg-gray-800 text-white"
                                    required
                                />
                                <datalist id="categories">
                                    {allCategories.slice(0, 10).map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>

                                {category && (
                                    <>
                                        <input
                                            list="subcategories"
                                            placeholder="Sous-catégorie"
                                            value={subcategory}
                                            onChange={e => setSubcategory(e.target.value)}
                                            className="w-40% p-2 rounded bg-gray-800 text-white"
                                            required
                                        />
                                        <datalist id="subcategories">
                                            {filteredSubcategories.slice(0, 10).map(sub => (
                                                <option key={sub} value={sub} />
                                            ))}
                                        </datalist>
                                    </>
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={e => setImageFile(e.target.files?.[0] || null)}
                            className="w-full p-1 rounded bg-gray-800 text-white"
                        />


                        <button
                            type="submit"
                            className="bg-[#ffc272] text-black px-3 py-1 rounded hover:bg-[#d9a556] transition-colors"
                        >
                            {editingProductId ? "Modifier" : "Ajouter"}
                        </button>
                    </form>

                    {/* Liste des produits */}
                    <div className="mt-6 space-y-2">
                        {loading ? (
                            <p>Chargement des produits...</p>
                        ) : products.length === 0 ? (
                            <p>Aucun produit</p>
                        ) : (
                            products.map(p => (
                                <div key={p.id} className="flex flex-wrap items-center bg-gray-800 p-2 rounded">
                                    <span className="flex-1 min-w-[120px]">{p.title} - {p.price}€</span>
                                    <div className="ml-auto flex space-x-2 mt-2 sm:mt-0">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="px-2 py-1 bg-red-600 rounded hover:bg-red-500"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
