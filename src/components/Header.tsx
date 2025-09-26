import React from "react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  query: string;
  setQuery: (q: string) => void;
}

export function Header({ cartCount, onOpenCart, query, setQuery }: HeaderProps) {
  return (
    <div className="bg-black">
      <header className="bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-evenly">

          {/* Logo + E-Shop */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <img
              src="/logo/bkdesignlogo.png"
              alt="BKDesign Logo"
              className="h-16 md:h-20 w-auto object-contain mr-10"
            />
            <div className="text-4xl  tracking-tight text-[#ffc272] " style={{ fontFamily: "Great Vibes" }}>
              e-Shop
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-8 md:gap-16 text-lg text-[#ffc272] whitespace-nowrap">
            <a href="/produits/décoration" className="hover:text-white transition-colors">
              Décoration
            </a>
            <a href="/produits/fleurs" className="hover:text-white transition-colors">
              Fleurs artificielles
            </a>
            <a href="/produits/cadre-plexi" className="hover:text-white transition-colors">
              Cadre plexi personnalisé
            </a>
          </nav>

          {/* Recherche + panier */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onOpenCart}
              className="relative inline-flex items-center gap-2 bg-[#b58545] text-white  hover:bg-[#d9a556] rounded-lg px-4 py-2  hover:text-black  active:bg-[#d9a556] transition-colors shadow-md hover:shadow-lg
"            >
              Panier
              {cartCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-red-500 text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

    </div>
  );
}
