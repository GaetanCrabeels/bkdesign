import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  query: string;
  setQuery: (q: string) => void;
}

export function Header({ cartCount, onOpenCart, query, setQuery }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        {/* Zone gauche : Logo + e-Shop */}
        <div className="flex items-center gap-3 flex-shrink-0">
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
            className="text-2xl sm:text-3xl tracking-tight text-[#ffc272] hover:text-white transition-colors"
            style={{ fontFamily: "Great Vibes" }}
          >
            e-Shop
          </Link>
        </div>

        {/* Menu desktop (caché sur mobile) */}
        <nav className="hidden md:flex gap-6 text-lg text-[#ffc272]">
          {["Décoration", "Fleurs", "Cadre Plexi"].map((item) => (
            <Link
              key={item}
              to={`/produits?category=${encodeURIComponent(item)}&`}
              className="hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Zone droite : Panier + Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-2 bg-[#b58545] text-white hover:bg-[#d9a556] rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 hover:text-black transition-colors shadow-md"
          >
            Panier
            {cartCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-red-500 text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Hamburger plus compact sur mobile */}
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
          {["Décoration", "Fleurs artificielles", "Cadre plexi personnalisé"].map(
            (item) => (
              <Link
                key={item}
                to={`/produits?category=${encodeURIComponent(item)}&`}
                className="hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </Link>
            )
          )}
        </div>
      )}
    </header>
  );
}
