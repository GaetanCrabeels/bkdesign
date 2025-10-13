import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Product } from "../types/product";
import { Header } from "../components/Header";
import { AutoCarousel } from "../components/Carousel";
import { Footer } from "../components/Footer";
import { useCart } from "../components/useCart";
import { supabase } from "../lib/supabaseClient";

const ProductModal = lazy(() => import("../components/ProductModal"));
const CartModal = lazy(() => import("../components/CartModal"));
const ProductCarousel = lazy(() => import("../components/ProductCarousel"));

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { cart, addToCart, updateCart } = useCart();

  // 🔹 Fetch produits
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


  // 🔹 Filtrage
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [query, products]);

  const categories = Array.from(new Set(filtered.map(p => p.category))).sort();

  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      <Header
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onOpenCart={() => setCartOpen(true)}
        query={query}
        setQuery={setQuery}
        categories={categories}
      />

      <div className="max-w-7xl mx-auto border-x-2 border-[#2a2b2c] ">
        <section className="w-full flex flex-col items-center text-center py-10 sm:py-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#ffc272] drop-shadow-lg mb-6 sm:mb-8">
            Bienvenue dans notre e-Shop
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#ffc272] mb-6">
            CONCEPT STORE DÉCO, MODE & ÉNERGIE
          </p>

          <p className="max-w-4xl text-base sm:text-lg md:text-xl leading-relaxed text-[#d6b98d] mb-4 mx-4 text-justify">
            Découvrez un univers unique où se rencontrent :
          </p>

          <ul className="max-w-4xl text-base sm:text-lg md:text-xl leading-relaxed text-[#d6b98d] mb-4 mx-4 text-left list-disc list-inside space-y-2">
            <li>Décoration intérieure : cadres, vases, fleurs artificielles, objets design...</li>
            <li>Pierres naturelles & bijoux énergétiques : minéraux, bijoux, encens, spiritualité...</li>
            <li>Mode chic : vestes en fausse fourrure & accessoires tendance.</li>
          </ul>

          <p className="max-w-4xl text-base sm:text- md:text-xl leading-relaxed text-[#d6b98d] mb-6 mx-4 text-justify">
            Un lieu moderne, inspirant et raffiné pour sublimer votre intérieur, votre style et votre énergie.
          </p>

          <p className="max-w-4xl sm:text-lg leading-relaxed text-[#d6b98d] mb-6 mx-4 text-center font-semibold">
            MONS - RUE DES FRIPIERS 22B
          </p>

          <div className="w-full max-w-5xl min-h-5 overflow-hidden rounded-xl mb-0">
            <AutoCarousel />
          </div>
        </section>

        <main className="px-4 py-8 sm:py-16 space-y-12">
          {loading && <div>Chargement...</div>}

          {!loading && categories.map(cat => {
            const productsInCat = filtered.filter(p => p.category === cat);
            if (!productsInCat.length) return null;
            return (
              <div key={cat} className="space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-6xl text-center mb-10">{cat}</h2>
                <Suspense fallback={<div className="h-64 bg-[#1b1c1d] animate-pulse rounded-xl" />}>
                  <ProductCarousel
                    products={productsInCat}
                    onOpen={p => setSelectedProduct(p)}
                    onAdd={addToCart}
                  />
                </Suspense>
              </div>
            );
          })}

          {!loading && filtered.length === 0 && <p className="text-center text-[#d6b98d]">Aucun produit trouvé.</p>}
        </main>
      </div>

      {selectedProduct && (
        <Suspense fallback={null}>
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAdd={addToCart}
          />
        </Suspense>
      )}

      {cartOpen && (
        <Suspense fallback={null}>
          <CartModal
            items={cart}
            onClose={() => setCartOpen(false)}
            onUpdateCart={updateCart}
          />
        </Suspense>
      )}

      <Footer />
    </div>
  );
}
