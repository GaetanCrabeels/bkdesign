import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
export function AdminProductForm({ userRole, onProductsChange }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [openCategories, setOpenCategories] = useState({});
    const [openSubcategories, setOpenSubcategories] = useState({});
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: "",
        desc: "",
        cat: "",
        sub: "",
        price: "",
        imageFile: null,
    });
    const [variants, setVariants] = useState([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
    useEffect(() => {
        fetchProducts();
    }, []);
    async function fetchProducts() {
        setLoading(true);
        const { data: productsData } = await supabase
            .from("products")
            .select("*, is_hidden")
            .order("created_at", { ascending: false });
        if (!productsData)
            return setLoading(false);
        const productsWithVariants = await Promise.all(productsData.map(async (p) => {
            const { data: variantData } = await supabase
                .from("product_variants")
                .select("*")
                .eq("produit_id", p.id);
            return { ...p, variants: variantData || [] };
        }));
        setProducts(productsWithVariants);
        setLoading(false);
    }
    const handleChange = (field, value) => {
        setFormData((f) => ({ ...f, [field]: value }));
    };
    const handleVariantChange = (index, field, value) => {
        setVariants((prev) => {
            const newVariants = [...prev];
            if (field === "taille")
                newVariants[index][field] = value;
            else
                newVariants[index][field] = Number(value);
            return newVariants;
        });
    };
    const toggleHidden = async (id, newValue) => {
        const { error } = await supabase
            .from("products")
            .update({ is_hidden: newValue })
            .eq("id", id);
        if (error) {
            console.error(error);
            alert("Erreur lors de la mise à jour de la visibilité.");
            return;
        }
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_hidden: newValue } : p)));
    };
    const addVariant = () => setVariants([...variants, { taille: "", poids: 0, promotion: 0, quantity: 0 }]);
    const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i));
    const toggleCategory = (category) => setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));
    const toggleSubcategory = (category, subcategory) => {
        const key = `${category}-${subcategory}`;
        setOpenSubcategories((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const handleEdit = async (p) => {
        setEditingProduct(p);
        setFormData({
            title: p.title,
            desc: p.description || "",
            cat: p.category || "",
            sub: p.subcategory || "",
            price: p.price?.toString() || "",
            imageFile: null,
        });
        const { data: variantData } = await supabase
            .from("product_variants")
            .select("*")
            .eq("produit_id", p.id);
        setVariants(variantData?.map((v) => ({
            taille: v.taille || "",
            poids: v.poids || 0,
            promotion: v.promotion || 0,
            quantity: v.quantity || 0,
        })) || [{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
        setShowForm(true);
    };
    const handleDelete = async (id) => {
        if (!confirm("Supprimer ce produit ?"))
            return;
        await supabase.from("products").delete().eq("id", id);
        await supabase.from("product_variants").delete().eq("produit_id", id);
        setProducts(products.filter((p) => p.id !== id));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title)
            return alert("Titre requis");
        let image_url = editingProduct?.image_url || "";
        if (formData.imageFile) {
            const fileExt = formData.imageFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("BKDesign")
                .upload(fileName, formData.imageFile);
            if (uploadError)
                return alert("Erreur upload image: " + uploadError.message);
            const { data } = supabase.storage.from("BKDesign").getPublicUrl(fileName);
            image_url = data.publicUrl;
        }
        const productData = {
            title: formData.title,
            description: formData.desc,
            category: formData.cat,
            subcategory: formData.sub,
            price: Number(formData.price),
            image_url,
        };
        let productId = editingProduct?.id;
        if (editingProduct) {
            await supabase.from("products").update(productData).eq("id", editingProduct.id);
            await supabase.from("product_variants").delete().eq("produit_id", editingProduct.id);
        }
        else {
            const { data, error } = await supabase.from("products").insert([productData]).select("id");
            if (error)
                return alert(error.message);
            productId = data?.[0].id;
        }
        if (productId && variants.length > 0) {
            await supabase.from("product_variants").insert(variants.map((v) => ({ produit_id: productId, ...v })));
        }
        setEditingProduct(null);
        setFormData({ title: "", desc: "", cat: "", sub: "", price: "", imageFile: null });
        setVariants([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
        if (fileInputRef.current)
            fileInputRef.current.value = "";
        fetchProducts();
        if (onProductsChange)
            onProductsChange(products);
    };
    if (userRole !== "admin")
        return null;
    return (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "mb-4", children: _jsx("button", { onClick: () => setShowForm(!showForm), className: "bg-[#ffc272] text-[#111213] px-3 py-1 rounded hover:bg-[#d9a556]", children: showForm ? "Masquer formulaire admin" : "Afficher formulaire admin" }) }), showForm && (_jsx("div", { className: "flex justify-center w-full", children: _jsxs("div", { className: "bg-[#1b1c1d] w-max rounded-2xl text-[#ffc272] p-4 mb-20", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-3 mt-4", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("input", { placeholder: "Titre", value: formData.title, onChange: e => handleChange("title", e.target.value), className: "w-48 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" }), _jsx("input", { placeholder: "Cat\u00E9gorie", value: formData.cat, onChange: e => handleChange("cat", e.target.value), list: "categories-list", className: "w-48 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" }), _jsx("datalist", { id: "categories-list", children: products.map(p => p.category).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(cat => _jsx("option", { value: cat }, cat)) }), _jsx("input", { placeholder: "Sous-cat\u00E9gorie", value: formData.sub, onChange: e => handleChange("sub", e.target.value), list: "subcategories-list", className: "w-48 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" }), _jsx("datalist", { id: "subcategories-list", children: products.filter(p => p.category === formData.cat && p.subcategory).map(p => p.subcategory).filter((v, i, a) => a.indexOf(v) === i).map(sub => _jsx("option", { value: sub }, sub)) }), _jsx("input", { type: "number", placeholder: "Prix", value: formData.price, onChange: e => handleChange("price", e.target.value), className: "w-24 p-1 rounded bg-[#2a2b2c] text-[#ffc272]" })] }), _jsx("textarea", { placeholder: "Description", value: formData.desc, onChange: e => handleChange("desc", e.target.value), className: "w-full p-1 rounded bg-[#2a2b2c] text-[#ffc272]" }), _jsxs("div", { className: "flex items-center gap-3", children: [editingProduct?.image_url && _jsx("img", { src: editingProduct.image_url, alt: "preview", className: "mt-4 w-auto h-24 rounded" }), _jsx("input", { type: "file", ref: fileInputRef, onChange: e => handleChange("imageFile", e.target.files?.[0] || null), className: "rounded bg-[#2a2b2c] text-[#ffc272]" })] }), _jsxs("div", { className: "bg-[#2a2b2c] p-2 rounded mt-2", children: [_jsx("h4", { className: "font-semibold mb-1 text-[#ffc272]", children: "Variantes" }), variants.map((v, i) => (_jsxs("div", { className: "flex gap-1 mb-1 flex-wrap items-center", children: [_jsx("input", { placeholder: "Taille", value: v.taille, onChange: e => handleVariantChange(i, "taille", e.target.value), className: "p-1 rounded w-20 bg-[#1b1c1d] text-[#ffc272]" }), _jsx("input", { placeholder: "Poids(gramme)", type: "number", value: v.poids === 0 ? "" : v.poids, required: true, onChange: e => handleVariantChange(i, "poids", e.target.value), className: "p-1 rounded w-32 bg-[#1b1c1d] text-[#ffc272]" }), _jsx("input", { placeholder: "Promo %", type: "number", value: v.promotion === 0 ? "" : v.promotion, onChange: e => handleVariantChange(i, "promotion", e.target.value), className: "p-1 rounded w-24 bg-[#1b1c1d] text-[#ffc272]" }), _jsx("input", { placeholder: "Quantit\u00E9", type: "number", value: v.quantity === 0 ? "" : v.quantity, onChange: (e) => handleVariantChange(i, "quantity", e.target.value), className: "p-1 rounded w-24 bg-[#1b1c1d] text-[#ffc272]" }), _jsx("button", { type: "button", onClick: () => removeVariant(i), className: "bg-red-600 px-2 rounded text-white", children: "\uD83D\uDDD1" })] }, i))), _jsx("button", { type: "button", onClick: addVariant, className: "bg-[#ffc272] text-[#111213] px-2 py-1 rounded mt-1 hover:bg-[#d9a556]", children: "Ajouter variante" })] }), _jsxs("div", { className: "flex items-center gap-2 mt-6", children: [_jsx("button", { type: "submit", className: "bg-[#ffc272] text-[#111213] px-3 py-1 rounded hover:bg-[#d9a556]", children: editingProduct ? "Enregistrer les modifications" : "Ajouter le produit" }), editingProduct && (_jsx("button", { type: "button", onClick: () => {
                                                setEditingProduct(null);
                                                setFormData({ title: "", desc: "", cat: "", sub: "", price: "", imageFile: null });
                                                setVariants([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
                                                if (fileInputRef.current)
                                                    fileInputRef.current.value = "";
                                            }, className: "bg-[#ffc272] text-[#111213] px-3 py-1 rounded hover:bg-red-500", children: "Annuler la modification" }))] })] }), _jsx("hr", { className: "my-20 h-1 rounded bg-[#ffffff]" }), _jsx("h1", { className: "font-bold text-4xl text-[#ffc272] mb-2", style: { fontFamily: "Barlow" }, children: "Liste des produits" }), _jsx("div", { className: "mt-4", children: loading ? (_jsx("p", { children: "Chargement..." })) : (products.length > 0 &&
                                Object.entries(products.reduce((acc, p) => {
                                    const catKey = p.category || "Sans catégorie";
                                    if (!acc[catKey])
                                        acc[catKey] = [];
                                    acc[catKey].push(p);
                                    return acc;
                                }, {})).map(([category, catProducts]) => (_jsxs("div", { className: "mb-4", children: [_jsxs("button", { onClick: () => toggleCategory(category), className: "text-lg font-bold mb-1 text-[#ffc272] flex justify-between px-2 py-1 rounded hover:bg-[#2a2b2c]", children: [category, " ", openCategories[category] ? "▼" : "►"] }), openCategories[category] &&
                                            Object.entries(catProducts.reduce((acc, p) => {
                                                const subKey = p.subcategory || "Sans sous-catégorie";
                                                if (!acc[subKey])
                                                    acc[subKey] = [];
                                                acc[subKey].push(p);
                                                return acc;
                                            }, {})).map(([subcategory, subProducts]) => {
                                                const combinedKey = `${category}-${subcategory}`;
                                                return (_jsxs("div", { className: "mb-2 ml-3", children: [subcategory !== "Sans sous-catégorie" && (_jsxs("button", { onClick: () => toggleSubcategory(category, subcategory), className: "text-left text-sm font-semibold mb-1 text-[#ffc272] px-2 py-1 rounded hover:bg-[#2a2b2c]", children: [subcategory, " ", openSubcategories[combinedKey] ? "▼" : "►"] })), openSubcategories[combinedKey] && (_jsx("div", { className: "flex flex-col gap-1 mt-1", children: subProducts.map((p) => (_jsxs("div", { className: "relative bg-[#2a2b2c] p-3 rounded-xl w-full shadow mb-2 flex gap-3", children: [_jsxs("div", { className: "absolute top-2 right-2 flex gap-2", children: [_jsxs("button", { onClick: () => handleEdit(p), className: "bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-500 text-white text-sm flex items-center gap-1", children: ["\u270E ", _jsx("span", { children: "Modifier" })] }), _jsxs("button", { onClick: () => handleDelete(p.id), className: "bg-red-600 px-2 py-0.5 rounded hover:bg-red-500 text-white text-sm flex items-center gap-1", children: ["\uD83D\uDDD1 ", _jsx("span", { children: "Supprimer" })] }), _jsxs("div", { onClick: () => toggleHidden(p.id, !p.is_hidden), className: `relative inline-flex items-center cursor-pointer select-none rounded-full w-28 h-8 transition-colors duration-600 
    ${!p.is_hidden ? "bg-green-600" : "bg-gray-600"}`, children: [_jsx("span", { className: `absolute left-0 top-0 h-8 w-8 bg-white rounded-full shadow transform transition-transform duration-600
      ${!p.is_hidden ? "translate-x-20" : "translate-x-0"}` }), _jsx("span", { className: "absolute inset-0 flex items-center justify-center font-medium text-sm text-white pointer-events-none", children: p.is_hidden ? "Caché" : "Publié" })] })] }), _jsx("img", { src: p.image_url, alt: p.title, className: "w-16 h-16 object-cover rounded" }), _jsxs("div", { className: "flex flex-col gap-1 pr-16", children: [_jsx("h4", { className: "font-semibold text-[#ffc272] text-lg", children: p.title }), _jsxs("p", { className: "text-[#ffc272]/80 font-medium", children: ["Prix de base : \u20AC", p.price] }), p.variants?.length > 0 && (_jsx("div", { className: "mt-2 flex flex-col gap-1 text-sm text-[#ffc272]/80", children: p.variants.map((v, index) => {
                                                                                    const basePrice = Number(p.price) || 0;
                                                                                    const discount = Number(v.promotion) || 0;
                                                                                    const finalPrice = (basePrice * (1 - discount / 100)).toFixed(2);
                                                                                    return (_jsxs("div", { className: "bg-[#1b1c1d] rounded px-2 py-1 flex flex-wrap gap-3", children: [_jsxs("span", { children: [_jsx("strong", { children: "Taille :" }), " ", v.taille || "-"] }), _jsxs("span", { children: [_jsx("strong", { children: "Poids :" }), " ", v.poids, " g"] }), _jsxs("span", { children: [_jsx("strong", { children: "Promo :" }), " ", v.promotion, "%"] }), _jsxs("span", { children: [_jsx("strong", { children: "Quantit\u00E9 :" }), " ", v.quantity] }), _jsxs("span", { children: [_jsx("strong", { children: "Prix final :" }), " \u20AC", finalPrice] })] }, index));
                                                                                }) }))] })] }, p.id))) }))] }, combinedKey));
                                            })] }, category)))) })] }) }))] }));
}
