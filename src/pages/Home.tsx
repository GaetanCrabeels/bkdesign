import { useState, useEffect, useMemo } from "react";
import { Product, CartItem } from "../types/product";
import { Header } from "../components/Header";
import { ProductModal } from "../components/ProductModal";
import { AutoCarousel } from "../components/Carousel";
import { ProductCarousel } from "../components/ProductCarousel"; 
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // ✅ Fetch produits depuis Supabase
  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("products").select("*");
        if (error) {
          console.error("Erreur Supabase:", error);
          setProducts([]);
        } else if (mounted) {
          setProducts((data as Product[]) || []);
        }
      } catch (err) {
        console.error("Erreur lors du fetch des produits:", err);
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, []);

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
      return [...prev, { id: product.id, title: product.title, price: product.price, qty }];
    });
  }

  // ✅ Liste des catégories uniques (triées)
  const categories = Array.from(
    new Set(filtered.map((p) => p.category))
  ).sort();

  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      <Header
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onOpenCart={() => console.log("Ouvrir panier à implémenter")}
        query={query}
        setQuery={setQuery}
      />

      <div className="max-w-7xl mx-auto border-x-4 border-[#2a2b2c]">
        <section className="w-full flex flex-col items-center text-center py-12">
          <h1 className="text-7xl text-[#ffc272] drop-shadow-lg mb-10">
            Bienvenue dans notre e-Shop
          </h1>
          <p className="max-w-4xl text-base md:text-lg leading-10 text-[#d6b98d] mb-5 text-justify">
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
          <AutoCarousel />
        </section>

        <hr className="border-y-2 border-[#2a2b2c] max-w-screen-lg mx-auto mt-5 mb-10" />

        <main className="px-4 py-16 space-y-12 ">
          {loading && <p className="text-center">Chargement des produits...</p>}

          {!loading &&
            categories.map((cat) => {
              const productsInCat = filtered.filter((p) => p.category === cat);
              if (productsInCat.length === 0) return null;

              return (
                <div key={cat} className="space-y-6">
                  <h2 className="text-6xl text-center">{cat}</h2>
                  <ProductCarousel
                    products={productsInCat}
                    onOpen={(p) => setSelectedProduct(p)}
                    onAdd={addToCart}
                  />
                </div>
              );
            })}

          {!loading && filtered.length === 0 && (
            <p className="text-center text-[#d6b98d]">
              Aucun produit trouvé.
            </p>
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
  );
}
