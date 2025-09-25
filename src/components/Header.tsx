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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo + E-Shop */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img
              src="/logo/bkdesignlogo.png"
              alt="BKDesign Logo"
              className="h-24 w-auto object-contain"
            />
            <div className="text-3xl tracking-tight text-[#b58545] ml-4">
              e-Shop
            </div>
          </div>

          <nav className="flex justify-center gap-16 text-lg text-[#b58545] whitespace-nowrap">
            <a href="#" className="hover:text-white transition-colors">Décoration</a>
            <a href="#" className="hover:text-white transition-colors">Fleurs artificielles</a>
            <a href="#" className="hover:text-white transition-colors">Cadre plexi personnalisé</a>

          </nav>

          {/* Recherche + panier */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onOpenCart}
              className="relative inline-flex bg-[#b58545] items-center gap-2  rounded-lg hover:bg-[#f3c37a] hover:text-black transition-colors "
            >
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
