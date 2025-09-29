import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  query: string;
  setQuery: (q: string) => void;
  categories: string[];
}

export function Header({ cartCount, onOpenCart, query, setQuery, categories }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Déterminer dynamiquement les tailles en fonction du nombre de catégories
  const { textSize, gapSize } = useMemo(() => {
    const count = categories.length;
    if (count <= 3) return { textSize: "text-2xl", gapSize: "gap-8" };
    if (count <= 5) return { textSize: "text-xl", gapSize: "gap-6" };
    if (count <= 7) return { textSize: "text-xs", gapSize: "gap-4" };
    return { textSize: "text-base", gapSize: "gap-3" }; // au-delà de 7, on réduit pour éviter de casser le layout
  }, [categories.length]);

  return (
    <header className="bg-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        {/* Logo + e-Shop */}
        <div className="flex items-center gap-3">
          <img
            src="/logo/bkdesignlogo.png"
            alt="BKDesign Logo"
            width={80}
            height={80}
            decoding="async"
            className="h-10 sm:h-14 w-auto object-contain"
          />
          <Link
            to="/"
            className="text-2xl sm:text-3xl text-[#ffc272] hover:text-white transition-colors"
            style={{ fontFamily: "Great Vibes" }}
          >
            e-Shop
          </Link>
        </div>

        {/* Menu nav desktop - ✅ tailles dynamiques */}
        <nav className={`hidden md:flex flex-1 justify-center ${gapSize} ${textSize} whitespace-nowrap text-[#ffc272]`}>
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/produits?category=${encodeURIComponent(cat)}`}
              className="hover:text-white transition-colors"
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Panier + Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-2 bg-[#b58545] text-white hover:bg-[#d9a556] rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 hover:text-black transition-colors shadow-md"
          >
            Panier
            {cartCount > 0 && (
              <span className="ml-1 w-5 h-5 text-xs rounded-full bg-red-500 text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden inline-flex items-center justify-center bg-[#b58545] text-white hover:bg-[#d9a556] rounded-lg p-2 hover:text-black transition-colors shadow-md"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-[#2a2b2c] flex flex-col px-6 py-4 space-y-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/produits?category=${encodeURIComponent(cat)}`}
              className="hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
