import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Product, CartItem } from "../types/product";
import { Header } from "../components/Header";
import { AutoCarousel } from "../components/Carousel";
import { supabase } from "../lib/supabaseClient";
import { Footer } from "../components/footer";

// ✅ Lazy loading pour réduire le bundle initial
const ProductModal = lazy(() => import("../components/ProductModal"));
const CartModal = lazy(() => import("../components/CartModal"));
const ProductCarousel = lazy(() => import("../components/ProductCarousel"));

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // ✅ Préchargement du logo pour éviter flash
  useEffect(() => {
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.href = "/logo/bkdesignlogo.png";
    document.head.appendChild(preload);
  }, []);

  // ✅ Fetch produits depuis Supabase
  useEffect(() => {
    let mounted = true;
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("products").select("*");
        if (mounted) setProducts(error ? [] : data || []);
      } catch {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Filtrage mémoïsé pour éviter re-renders inutiles
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [query, products]);

  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        { id: product.id, title: product.title, price: product.price, qty },
      ];
    });
  }

  const categories = Array.from(new Set(filtered.map((p) => p.category))).sort();

  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      <Header
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onOpenCart={() => setCartOpen(true)}
        query={query}
        setQuery={setQuery}
      />

      <div className="max-w-7xl mx-auto md:border-x-4 border-[#2a2b2c] px-4 sm:px-6 lg:px-8">
        <section className="w-full flex flex-col items-center text-center py-10 sm:py-12">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-balance text-[#ffc272] drop-shadow-lg mb-8 sm:mb-10">
            Bienvenue dans notre e-Shop
          </h1>

          <p className="max-w-4xl text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-9 text-[#d6b98d] mb-6 sm:mb-8 mx-4 text-justify text-balance">
            Nous proposons une sélection d’objets décoratifs, de meubles élégants et
            d’accessoires issus de marques prestigieuses telles que{" "}
            <span className="font-semibold">Richmond Interiors</span>,{" "}
            <span className="font-semibold">Countryfield</span> et{" "}
            <span className="font-semibold">Initials</span>. Que ce soit avec des vases,
            miroirs, bougies lumineuses ou parfums d’intérieur, chaque pièce de notre
            collection est pensée pour apporter charme et personnalité à vos espaces.
            <br />
            <br />
            Nous offrons également des services de conseils en décoration et stylisme
            d’intérieur pour vous accompagner dans vos projets.
            <br />
            <br />
            Venez découvrir notre univers et laissez-vous inspirer par{" "}
            <span className="font-semibold">BK Design</span>, où chaque détail fait la
            différence.
          </p>

          {/* ✅ Aspect ratio réservé pour éviter CLS */}
          <div className="w-full max-w-5xl aspect-[16/9] overflow-hidden rounded-xl">
            <AutoCarousel />
          </div>

          <hr className="border-y-2 border-[#2a2b2c] max-w-screen-lg mx-auto mt-6 mb-10" />

          <main className="px-4 py-8 sm:py-16 space-y-12">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-72 bg-[#1b1c1d] animate-pulse rounded-lg"
                  />
                ))}
              </div>
            )}

            {!loading &&
              categories.map((cat) => {
                const productsInCat = filtered.filter((p) => p.category === cat);
                if (!productsInCat.length) return null;
                return (
                  <div key={cat} className="space-y-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl text-center">
                      {cat}
                    </h2>
                    <Suspense
                      fallback={
                        <div className="h-64 bg-[#1b1c1d] animate-pulse rounded-xl" />
                      }
                    >
                      <ProductCarousel
                        products={productsInCat}
                        onOpen={(p) => setSelectedProduct(p)}
                        onAdd={addToCart}
                      />
                    </Suspense>
                  </div>
                );
              })}

            {!loading && filtered.length === 0 && (
              <p className="text-center text-[#d6b98d]">Aucun produit trouvé.</p>
            )}
          </main>
        </section>
      </div>

      {/* ✅ Modals chargés en lazy */}
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
          <CartModal items={cart} onClose={() => setCartOpen(false)} />
        </Suspense>
      )}

      <Footer />
    </div>
  );
}
