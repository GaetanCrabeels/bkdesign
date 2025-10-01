import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  categories: string[];
}

export function Header({ cartCount, onOpenCart, categories }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Vérifier si un utilisateur est connecté au montage
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    // Écoute des changements d'auth
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      setShowLogin(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-black shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-3 items-center h-16 sm:h-20">
        {/* Logo + e-Shop */}
        <div className="flex items-center gap-3 justify-self-start">
          <img
            src="/logo/bkdesignlogo.png"
            alt="BKDesign Logo"
            width={80}
            height={80}
            className="h-10 sm:h-14 w-auto object-contain"
          />
          <Link
            to="/"
            className="text-xl sm:text-3xl text-[#ffc272] hover:text-white transition-colors"
            style={{ fontFamily: "Great Vibes" }}
          >
            e-Shop
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex justify-center gap-6 text-[#ffc272]">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/produits?category=${encodeURIComponent(cat)}`}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Panier + Auth */}
        <div className="flex items-center gap-3 justify-self-end">
          {/* Panier */}
          <button
            onClick={onOpenCart}
            className="relative inline-flex items-center justify-center bg-black text-[#ffc272] rounded-full p-2 sm:px-4 sm:py-2 hover:text-white transition-colors shadow-md"
          >
            <ShoppingCart size={20} className="sm:hidden" /> {/* icône seule en mobile */}
            <span className="hidden sm:inline">Panier</span> {/* texte à partir de sm */}
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full bg-red-500 text-white flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
           {/* Hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center bg-black text-[#ffc272] hover:bg-[#d9a556] rounded-lg p-2 hover:text-black transition-colors shadow-md"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Auth */}
          {!user ? (
            <button
              onClick={() => setShowLogin(true)}
              className="p-2 sm:p-3 rounded-full bg-black text-[#ffc272] hover:text-white transition-colors shadow-md"
              aria-label="Se connecter"
            >
              <User size={20} className="sm:w-6 sm:h-6" />
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 sm:p-3 rounded-full bg-red-600 text-[#ffc272] hover:bg-red-700 transition-colors shadow-md"
              aria-label="Déconnexion"
            >
              <User size={20} className="sm:w-6 sm:h-6" />
            </button>
          )}
          

         
        </div>

      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-[#2a2b2c] flex flex-col px-6 py-4 space-y-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/produits?category=${encodeURIComponent(cat)}`}
              className="hover:text-white transition-colors whitespace-nowrap "
              onClick={() => setMenuOpen(false)}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {/* Modal Login */}
      {showLogin && !user && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <form
            onSubmit={handleLogin}
            className="bg-gray-900 p-6 rounded-xl shadow-lg w-80 space-y-4"
          >
            <h2 className="text-2xl  text-[#ffc272]">Connexion</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="flex-1 text-black  bg-[#b58545] py-2 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 text-black bg-[#b58545] py-2 rounded-lg hover:bg-[#d9a556]"
              >
                Connexion
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
