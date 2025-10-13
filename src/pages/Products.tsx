import { useState, useEffect, useMemo, lazy } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product } from "../types/product";
import { Header } from "../components/Header";
import { ProductCard } from "../components/ProductCard";
import { AdminProductForm } from "../components/AdminProductForm";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";
import { useCart } from "../components/useCart";

const ProductModal = lazy(() => import("../components/ProductModal"));
const CartModal = lazy(() => import("../components/CartModal"));

export default function Produits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  const { cart, addToCart, updateCart } = useCart();

  // --- URL → catégories / sous-catégories
  useEffect(() => {
    const catFromQuery = searchParams.get("category");
    const subFromQuery = searchParams.get("subcategory");
    const subFromPath = params.subcategory;

    setSelectedCategory(catFromQuery ?? null);
    if (subFromQuery) setSelectedSubcategory(subFromQuery);
    else if (subFromPath) setSelectedSubcategory(subFromPath);
    else setSelectedSubcategory(null);
  }, [searchParams, params]);

  // --- Rôle utilisateur
  useEffect(() => {
    async function fetchUserRole() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const userId = userData.user.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error) setUserRole(data?.role);
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
      .eq("is_hidden", false);  // 👈 on ne récupère que les produits visibles

    if (error) {
      console.error(error);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  fetchProducts();
}, []);


  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);
  const subcategories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .filter((p) => !selectedCategory || p.category === selectedCategory)
            .map((p) => p.subcategory)
            .filter((s): s is Exclude<typeof s, undefined> => s !== undefined)
        )
      ),
    [products, selectedCategory]
  );

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

  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      <Header
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onOpenCart={() => setCartOpen(true)}
        query={query}
        setQuery={setQuery}
        categories={categories}
      />

      <div className="max-w-7xl mx-auto border-x-4 border-[#2a2b2c] px-6 py-10">
        <h1 className="text-4xl text-center mb-4 md:text-7xl">Tous nos produits</h1>

        {userRole === "admin" && <AdminProductForm userRole={userRole} onProductsChange={setProducts} />}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="hidden md:block bg-[#1b1c1d] rounded-2xl p-4 space-y-6">
            <div>
              <h3 className="text-6xl mb-5 text-center">Catégories</h3>
              <div className="flex flex-col space-y-2">
                <button className={`text-left px-3 py-2 rounded-xl ${!selectedCategory ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`} onClick={() => { setSelectedCategory(null); navigate("/produits"); }}>Toutes</button>
                {categories.map(cat => (
                  <button key={cat} className={`text-left px-3 py-2 rounded-xl ${selectedCategory === cat ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`} onClick={() => { setSelectedCategory(cat); navigate(`/produits?category=${encodeURIComponent(cat)}`); }}>{cat}</button>
                ))}
              </div>
            </div>

            {selectedCategory && subcategories.length > 0 && (
              <div>
                <h3 className="text-4xl mb-5 text-center">Sous-catégories</h3>
                <div className="flex flex-col space-y-2">
                  <button className={`text-left px-3 py-2 rounded-xl ${!selectedSubcategory ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`} onClick={() => setSelectedSubcategory(null)}>Toutes</button>
                  {subcategories.map(subcat => (
                    <button key={subcat} className={`text-left px-3 py-2 rounded-xl ${selectedSubcategory === subcat ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"}`} onClick={() => setSelectedSubcategory(subcat)}>{subcat}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-3xl mb-2 text-center">Prix</h3>
              <input type="range" min={0} max={1000} value={priceRange[1]} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="w-full accent-[#ffc272]" />
              <p className="text-sm text-[#ffc272] text-center">Jusqu'à {priceRange[1]} €</p>
            </div>
          </aside>

          <main className="md:col-span-3">
            {loading ? <p className="text-center">Chargement...</p> :
              filtered.length === 0 ? (
                <div className="flex items-center justify-center h-[50vh]">
                  <p className="text-center text-[#ffffff] text-xl font-semibold">Aucun produit trouvé.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onOpen={() => setSelectedProduct(p)}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              )}
          </main>
        </div>

        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={addToCart}
          />
        )}
      </div>

      {cartOpen && <CartModal
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateCart={updateCart}
      />}
      <Footer />
    </div>
  );
}
