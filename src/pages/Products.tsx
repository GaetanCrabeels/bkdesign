import { useState, useEffect, useMemo, lazy } from "react";
import { supabase } from "../lib/supabaseClient";
import { Product, CartItem } from "../types/product";
import { Header } from "../components/Header";
import { ProductCard } from "../components/ProductCard";
import { Menu, ChevronRight } from "lucide-react"; // ✅ Icône hamburger
import { AdminProductForm } from "../components/AdminProductForm";


const ProductModal = lazy(() => import("../components/ProductModal"));
const CartModal = lazy(() => import("../components/CartModal"));
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";

export default function Produits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ✅ Panier
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ✅ Drawer mobile
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ États pour les filtres
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  // ✅ Hooks router
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  // ✅ Lire catégorie et sous-catégorie depuis l'URL
  useEffect(() => {
    const catFromQuery = searchParams.get("category");
    const subFromQuery = searchParams.get("subcategory");
    const subFromPath = params.subcategory;

    setSelectedCategory(catFromQuery ?? null);
    if (subFromQuery) setSelectedSubcategory(subFromQuery);
    else if (subFromPath) setSelectedSubcategory(subFromPath);
    else setSelectedSubcategory(null);
  }, [searchParams, params]);
  useEffect(() => {
  async function fetchUserRole() {
    // Récupérer l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return;

    const userId = userData.user.id; // UUID correct

    // Maintenant on peut interroger la table profiles
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single(); // un seul résultat attendu

    if (error) return console.error("Erreur fetch role:", error);

    setUserRole(data?.role);
  }
  fetchUserRole();
}, []);

  // ✅ Synchroniser l'état avec l'URL
  function handleCategoryChange(cat: string | null) {
    setSelectedCategory(cat);
    navigate(cat ? `/produits?category=${encodeURIComponent(cat)}` : "/produits");
  }

  function handleSubcategoryChange(subcat: string | null) {
    setSelectedSubcategory(subcat);
    navigate(
      `/produits?${selectedCategory ? `category=${encodeURIComponent(selectedCategory)}&` : ""}${subcat ? `subcategory=${encodeURIComponent(subcat)}` : ""
      }`
    );
  }

  // ✅ Fetch produits
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase.from("products").select("*");
      if (error) console.error("Erreur :", error);
      else setProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // ✅ Panier — Ajout d’un produit
  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { id: product.id, title: product.title, price: product.price, qty }];
    });
  }

  // ✅ Extraire catégories et sous-catégories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  const subcategories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter((p) => !selectedCategory || p.category === selectedCategory)
          .map((p) => p.subcategory)
          .filter((s): s is Exclude<typeof s, undefined> => s !== undefined)
      )
    );
  }, [products, selectedCategory]);

  // ✅ Filtrage
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      const matchesSubcategory = selectedSubcategory ? p.subcategory === selectedSubcategory : true;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice;
    });
  }, [query, products, selectedCategory, selectedSubcategory, priceRange]);

  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      {/* ✅ Bouton d'ouverture du menu latéral (mobile uniquement) */}
      <button
        className="md:hidden absolute top-16 left-1 z-50 p-1 text-[#ffc272] flex items-center gap-2 bg-[#111213]"
        onClick={() => setDrawerOpen(true)}
        aria-label="Ouvrir les filtres"
      > Filtres
        <ChevronRight size={24} />
      </button>

      <Header
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        query={query}
        setQuery={setQuery}
        categories={categories} // ✅ On passe les catégories dynamiques ici

      />

      <div className="max-w-7xl mx-auto border-x-4 border-[#2a2b2c] px-6 py-10">
        <h1 className="text-4xl text-center mb-4 md:text-7xl">Tous nos produits</h1>
        {userRole === "admin" && (
          <div className="mb-8">
            <AdminProductForm userRole={userRole} onProductsChange={setProducts} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* --- FILTRES (desktop) --- */}
          <aside className="hidden md:block bg-[#1b1c1d] rounded-2xl p-4 space-y-6">
            {/* ✅ même contenu qu'avant */}
            <div>
              <h3 className="text-6xl mb-5 text-center">Catégories</h3>
              <div className="flex flex-col space-y-2">
                <button
                  className={`text-left px-3 py-2 rounded-xl ${!selectedCategory ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"
                    }`}
                  onClick={() => handleCategoryChange(null)}
                >
                  Toutes
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`text-left px-3 py-2 rounded-xl ${selectedCategory === cat
                      ? "bg-[#ffc272] text-[#111213]"
                      : "hover:bg-[#2a2b2c]"
                      }`}
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ Sous-catégories */}
            {selectedCategory && subcategories.length > 0 && (
              <div>
                <h3 className="text-4xl mb-5 text-center">Sous-catégories</h3>
                <div className="flex flex-col space-y-2">
                  <button
                    className={`text-left px-3 py-2 rounded-xl ${!selectedSubcategory
                      ? "bg-[#ffc272] text-[#111213]"
                      : "hover:bg-[#2a2b2c]"
                      }`}
                    onClick={() => handleSubcategoryChange(null)}
                  >
                    Toutes
                  </button>
                  {subcategories.map((subcat) => (
                    <button
                      key={subcat}
                      className={`text-left px-3 py-2 rounded-xl ${selectedSubcategory === subcat
                        ? "bg-[#ffc272] text-[#111213]"
                        : "hover:bg-[#2a2b2c]"
                        }`}
                      onClick={() => handleSubcategoryChange(subcat)}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ✅ Prix */}
            <div>
              <h3 className="text-3xl mb-2 text-center">Prix</h3>
              <input
                type="range"
                min={0}
                max={1000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-[#ffc272]"
              />
              <p className="text-sm text-[#ffc272] text-center">
                Jusqu'à {priceRange[1]} €
              </p>
            </div>
          </aside>

          {/* --- PRODUITS --- */}
          <main className="md:col-span-3">
            {loading ? (
              <p className="text-center">Chargement...</p>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-[50vh]">
                <p className="text-center text-[#ffffff] text-xl font-semibold">
                  Aucun produit trouvé.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpen={() => setSelectedProduct(p)}
                    onAdd={() => addToCart(p)}
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
            onAdd={(p) => addToCart(p)}
          />
        )}
      </div>

      {/* ✅ Drawer mobile */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-3/4 max-w-xs bg-[#1b1c1d] z-50 shadow-lg p-6 overflow-y-auto transform transition-transform duration-300">
            {/* Bouton fermer */}
            <button
              className="mb-6 text-right text-xl font-bold w-full"
              onClick={() => setDrawerOpen(false)}
            >
              ✕
            </button>

            {/* Catégories */}
            <h3 className="text-3xl mb-5 text-center">Catégories</h3>
            <button
              className={`block w-full text-left px-3 py-2 rounded-xl mb-2 ${!selectedCategory ? "bg-[#ffc272] text-[#111213]" : "hover:bg-[#2a2b2c]"
                }`}
              onClick={() => {
                handleCategoryChange(null);
                setDrawerOpen(false);

              }}
            >
              Toutes
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  handleCategoryChange(cat);
                }}
                className={`block w-full text-left px-3 py-2 rounded-xl mb-2 ${selectedCategory === cat
                  ? "bg-[#ffc272] text-[#111213]"
                  : "hover:bg-[#2a2b2c]"
                  }`}
              >
                {cat}
              </button>
            ))}

            {/* ✅ Sous-catégories */}
            {selectedCategory && subcategories.length > 0 && (
              <>
                <h3 className="text-2xl mt-6 mb-4 text-center">Sous-catégories</h3>
                <button
                  className={`block w-full text-left px-3 py-2 rounded-xl mb-2 ${!selectedSubcategory
                    ? "bg-[#ffc272] text-[#111213]"
                    : "hover:bg-[#2a2b2c]"
                    }`}
                  onClick={() => {
                    handleSubcategoryChange(null);
                    setDrawerOpen(false);
                  }}
                >
                  Toutes
                </button>
                {subcategories.map((subcat) => (
                  <button
                    key={subcat}
                    onClick={() => {
                      handleSubcategoryChange(subcat);
                      setDrawerOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-xl mb-2 ${selectedSubcategory === subcat
                      ? "bg-[#ffc272] text-[#111213]"
                      : "hover:bg-[#2a2b2c]"
                      }`}
                  >
                    {subcat}
                  </button>
                ))}
              </>
            )}

            {/* ✅ Prix */}
            <div className="mt-6">
              <h3 className="text-2xl mb-2 text-center">Prix</h3>
              <input
                type="range"
                min={0}
                max={1000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full accent-[#ffc272]"
              />
              <p className="text-sm text-[#ffc272] text-center">
                Jusqu'à {priceRange[1]} €
              </p>
            </div>
          </div>
        </>
      )}


      {isCartOpen && <CartModal items={cart} onClose={() => setIsCartOpen(false)} />}
      <Footer />
    </div>
  );
}
