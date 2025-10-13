import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product } from "../types/product";
import { Eye, EyeOff } from "lucide-react";

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

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    cat: "",
    sub: "",
    price: "",
    imageFile: null as File | null,
  });

  const [variants, setVariants] = useState<Variant[]>([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data: productsData } = await supabase
      .from("products")
      .select("*, is_hidden")   // 👈 important ici
      .order("created_at", { ascending: false });

    if (!productsData) return setLoading(false);

    const productsWithVariants: ProductWithVariants[] = await Promise.all(
      productsData.map(async (p) => {
        const { data: variantData } = await supabase
          .from("product_variants")
          .select("*")
          .eq("produit_id", p.id);
        return { ...p, variants: variantData || [] };
      })
    );

    setProducts(productsWithVariants);
    setLoading(false);
  }

  const handleChange = (field: keyof typeof formData, value: string | File | null) => {
    setFormData((f) => ({ ...f, [field]: value }));
  };

  const handleVariantChange = (index: number, field: VariantField, value: string) => {
    setVariants((prev) => {
      const newVariants = [...prev];
      if (field === "taille") newVariants[index][field] = value;
      else newVariants[index][field] = Number(value);
      return newVariants;
    });
  };
  const toggleHidden = async (id: string, newValue: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_hidden: newValue })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour de la visibilité.");
      return;
    }

    // 🔁 Mettre à jour localement sans refetch complet
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_hidden: newValue } : p))
    );
  };

  const addVariant = () =>
    setVariants([...variants, { taille: "", poids: 0, promotion: 0, quantity: 0 }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

  const toggleCategory = (category: string) =>
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));

  const toggleSubcategory = (category: string, subcategory: string) => {
    const key = `${category}-${subcategory}`;
    setOpenSubcategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

    const { data: variantData } = await supabase
      .from("product_variants")
      .select("*")
      .eq("produit_id", p.id);

    setVariants(
      variantData?.map((v) => ({
        taille: v.taille || "",
        poids: v.poids || 0,
        promotion: v.promotion || 0,
        quantity: v.quantity || 0,
      })) || [{ taille: "", poids: 0, promotion: 0, quantity: 0 }]
    );

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("products").delete().eq("id", id);
    await supabase.from("product_variants").delete().eq("produit_id", id);
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert("Titre requis");

    let image_url = editingProduct?.image_url || "";
    if (formData.imageFile) {
      const fileExt = formData.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("BKDesign")
        .upload(fileName, formData.imageFile);
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
      image_url,
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
        variants.map((v) => ({ produit_id: productId, ...v }))
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
    <div className="bg-[#1b1c1d] w-max rounded-2xl text-[#ffc272] p-4 mb-20">
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-[#ffc272] text-[#111213] px-3 py-1 rounded hover:bg-[#d9a556]"
      >
        {showForm ? "Masquer formulaire admin" : "Afficher formulaire admin"}
      </button>

      {showForm && (
        <>
          {/* === FORMULAIRE PRODUIT === */}
          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
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

            <div className="flex items-center gap-3">
              {editingProduct?.image_url && <img src={editingProduct.image_url} alt="preview" className="mt-4 w-auto h-24 rounded" />}

              <input type="file" ref={fileInputRef} onChange={e => handleChange("imageFile", e.target.files?.[0] || null)} className=" rounded bg-[#2a2b2c] text-[#ffc272]" />
            </div>

            <div className="bg-[#2a2b2c] p-2 rounded mt-2">
              <h4 className="font-semibold mb-1 text-[#ffc272]">Variantes</h4>
              {variants.map((v, i) => (
                <div key={i} className="flex gap-1 mb-1 flex-wrap items-center">
                  <input placeholder="Taille" value={v.taille} onChange={e => handleVariantChange(i, "taille", e.target.value)} className="p-1 rounded w-20 bg-[#1b1c1d] text-[#ffc272]" />
                  <input placeholder="Poids(gramme)" type="number" value={v.poids === 0 ? "" : v.poids} onChange={e => handleVariantChange(i, "poids", e.target.value)} className="p-1 rounded w-32 bg-[#1b1c1d] text-[#ffc272]" />
                  <input placeholder="Promo %" type="number" value={v.promotion === 0 ? "" : v.promotion} onChange={e => handleVariantChange(i, "promotion", e.target.value)} className="p-1 rounded w-24 bg-[#1b1c1d] text-[#ffc272]" />
                  <button type="button" onClick={() => removeVariant(i)} className="bg-red-600 px-2 rounded text-white">🗑</button>
                </div>
              ))}

              <button type="button" onClick={addVariant} className="bg-[#ffc272] text-[#111213] px-2 py-1 rounded mt-1 hover:bg-[#d9a556]">Ajouter variante</button>
            </div>
            <div>
              <button
                type="submit"
                className="bg-[#ffc272] text-[#111213] px-3 py-1 rounded mt-6 hover:bg-[#d9a556]"
              >
                {editingProduct ? "Modifier le produit" : "Ajouter le produit"}
              </button>



              {/* 🆕 Bouton Annuler quand on est en mode édition */}
              {editingProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({ title: "", desc: "", cat: "", sub: "", price: "", imageFile: null });
                    setVariants([{ taille: "", poids: 0, promotion: 0, quantity: 0 }]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="bg-[#ffc272] text-[#111213] px-3 py-1 rounded mt-6 ml-2 hover:bg-red-500"
                >
                  Annuler la modification
                </button>
              )}
            </div>
          </form>

          {/* === SÉPARATION VISUELLE ET LISTE PRODUITS === */}
          <hr className="my-20  mb10 h-1 rounded bg-[#ffffff] " />
          <h1 className="font-bold text-4xl text-[#ffc272] mb-2" style={{ fontFamily: "Barlow" }}>
            Liste des produits
          </h1>

          <div className="mt-4">
            {loading ? (
              <p>Chargement...</p>
            ) : (
              products.length > 0 &&
              Object.entries(
                products.reduce<Record<string, ProductWithVariants[]>>((acc, p) => {
                  const catKey = p.category || "Sans catégorie";
                  if (!acc[catKey]) acc[catKey] = [];
                  acc[catKey].push(p);
                  return acc;
                }, {})
              ).map(([category, catProducts]) => (
                <div key={category} className="mb-4">
                  <button onClick={() => toggleCategory(category)} className="text-lg font-bold mb-1 text-[#ffc272] flex justify-between px-2 py-1 rounded hover:bg-[#2a2b2c]">
                    {category} {openCategories[category] ? "▼" : "►"}
                  </button>

                  {openCategories[category] &&
                    Object.entries(
                      catProducts.reduce<Record<string, ProductWithVariants[]>>((acc, p) => {
                        const subKey = p.subcategory || "Sans sous-catégorie";
                        if (!acc[subKey]) acc[subKey] = [];
                        acc[subKey].push(p);
                        return acc;
                      }, {})
                    ).map(([subcategory, subProducts]) => {
                      const combinedKey = `${category}-${subcategory}`;
                      return (
                        <div key={combinedKey} className="mb-2 ml-3">
                          {subcategory !== "Sans sous-catégorie" && (
                            <button
                              onClick={() => toggleSubcategory(category, subcategory)}
                              className="text-left text-sm font-semibold mb-1 text-[#ffc272] px-2 py-1 rounded hover:bg-[#2a2b2c]"
                            >
                              {subcategory} {openSubcategories[combinedKey] ? "▼" : "►"}
                            </button>
                          )}

                          {openSubcategories[combinedKey] && (
                            <div className="flex flex-col gap-1 mt-1">
                              {subProducts.map((p) => (
                                <div key={p.id} className="relative bg-[#2a2b2c] p-3 rounded-xl w-full shadow mb-2 flex gap-3">
                                  <div className="absolute top-2 right-2 flex gap-2">
                                    <button onClick={() => handleEdit(p)} className="bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-500 text-white text-sm" title="Modifier">✎</button>
                                    <button
                                      onClick={() => toggleHidden(p.id, !p.is_hidden)}
                                      className={`flex items-center gap-2  bg-gray-800 text-[#ffc272] rounded hover:bg-gray-700 transition px-2 py-0.5  text-sm ${p.is_hidden ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 hover:bg-gray-500"
                                        }`}
                                    >
                                      {p.is_hidden ? (
                                        <>
                                          <Eye className="w-5 h-5" />
                                          <span>Afficher</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="w-5 h-5" />
                                          <span>Cacher</span>
                                        </>
                                      )}
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="bg-red-600 px-2 py-0.5 rounded hover:bg-red-500 text-white text-sm" title="Supprimer">🗑</button>
                                  </div>

                                  <img src={p.image_url} alt={p.title} className="w-16 h-16 object-cover rounded" />

                                  <div className="flex flex-col gap-1 pr-16">
                                    <h4 className="font-semibold text-[#ffc272] text-lg">{p.title}</h4>
                                    <p className="text-[#ffc272]/80 font-medium">Prix de base : €{p.price}</p>

                                    {p.variants?.length! > 0 && (
                                      <div className="mt-2 flex flex-col gap-1 text-sm text-[#ffc272]/80">
                                        {p.variants!.map((v, index) => {
                                          const basePrice = Number(p.price) || 0;
                                          const discount = Number(v.promotion) || 0;
                                          const finalPrice = (basePrice * (1 - discount / 100)).toFixed(2);
                                          return (
                                            <div key={index} className="bg-[#1b1c1d] rounded px-2 py-1 flex flex-wrap gap-3">
                                              <span><strong>Taille :</strong> {v.taille || "-"}</span>
                                              <span><strong>Poids :</strong> {v.poids} kg</span>
                                              <span><strong>Promo :</strong> {v.promotion}%</span>
                                              <span><strong>Prix final :</strong> €{finalPrice}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
