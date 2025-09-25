import { useState, useMemo } from "react";
import { products } from "../data/products";
import { Product, CartItem } from "../types/product";
import { Header } from "../components/Header";
import { ProductCard } from "../components/ProductCard";
import { ProductModal } from "../components/ProductModal";
import { AutoCarousel } from "../components/Carousel";

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [query]);

  function addToCart(product: Product, qty = 1, color?: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.color === color);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id && i.color === color
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      return [
        ...prev,
        { id: product.id, title: product.title, price: product.price, qty, color },
      ];
    });
  }

  return (
    <div className="min-h-screen bg-[#101213] text-[#b58545]">
      <Header
        cartCount={cart.reduce((s, i) => s + i.qty, 0)}
        onOpenCart={() => console.log("Ouvrir panier à implémenter")}
        query={query}
        setQuery={setQuery}
      />

      <section className="w-full flex flex-col items-center">
        <h1 className="text-6xl text-[#b58545] drop-shadow-lg mt-8 mb-10 text-center" style={{ wordSpacing: "0.5rem" }}>
          Bienvenue dans notre e-Shop
        </h1>
        <p className="max-w-4xl text-base md:text-lg leading-10 text-justify text-[#d6b98d] mb-5">
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
        <br>
        
        </br>
        <br>
        </br>Venez découvrir notre
        univers et laissez-vous inspirer par{" "}
        <span className="font-semibold">BK Design</span>, où chaque détail fait la
        différence.
      </p>

        <div>
          <AutoCarousel />
        </div>
      </section>

      {/* ✅ Section Produits */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-6xl text-[#b58545] drop-shadow-lg flex justify-center mb-10">
          Nos produits
        </h1>

        <h3 className="text-5xl mb-6">Décoration</h3>
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

        <h3 className="text-5xl mb-6 mt-5">Fleurs artificielles</h3>
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

        <h3 className="text-5xl mb-6 mt-5">Cadre plexi personnalisé</h3>
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
      </main>

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
