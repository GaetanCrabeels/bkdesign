import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, ShoppingCart, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
export function Header({ cartCount, onOpenCart, categories }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showLogin, setShowLogin] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    // Vérifier si un utilisateur est connecté au montage
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        getUser();
        // Écoute des changements d'auth
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);
    // Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert(error.message);
        }
        else {
            setShowLogin(false);
            window.location.reload();
        }
    };
    // Sign-up handler
    const handleSignUp = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            alert("Erreur: " + error.message);
            return;
        }
        const identities = data.user?.identities ?? [];
        // Si identities est vide -> utilisateur existe déjà
        if (data.user && identities.length === 0) {
            alert("⚠️ Ce compte existe déjà. Essayez de vous connecter.");
            return;
        }
        // Si identities contient un élément -> nouvel utilisateur
        if (data.user && identities.length > 0) {
            alert("✅ Compte créé ! Vérifiez vos emails pour confirmer.");
            setShowSignUp(false);
            setShowLogin(false);
        }
    };
    // Logout handler
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
        setShowLogoutModal(false);
    };
    return (_jsxs("header", { className: "bg-black shadow-sm", children: [_jsxs("div", { className: "max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-3 items-center h-16 sm:h-20", children: [_jsxs("div", { className: "flex items-center gap-3 justify-self-start", children: [_jsx("img", { src: `${import.meta.env.BASE_URL}logo/bkdesignlogo.png`, alt: "BKDesign Logo", width: 80, height: 80, className: "h-10 sm:h-14 w-auto object-contain" }), _jsx(Link, { to: "/", className: "text-xl sm:text-3xl text-[#ffc272] hover:text-white transition-colors", style: { fontFamily: "Great Vibes" }, children: "e-Shop" })] }), _jsx("nav", { className: "hidden lg:flex text-xl justify-center flex-wrap md:flex-nowrap gap-6 text-[#ffc272] z-50", children: categories.map((cat) => (_jsx(Link, { to: `/produits?category=${encodeURIComponent(cat)}`, className: "hover:text-white transition-colors whitespace-nowrap text-base", children: cat }, cat))) }), _jsxs("div", { className: "flex items-end justify-end gap-1 z-50", children: [_jsxs("button", { onClick: onOpenCart, className: "fixed bottom-5 right-5 lg:bottom-8 lg:right-8 bg-black text-[#ffc272] rounded-full p-3 sm:p-4 hover:text-white transition-colors shadow-lg z-50", children: [_jsx(ShoppingCart, { size: 28 }), cartCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full bg-red-500 text-white flex items-center justify-center", children: cartCount }))] }), _jsx("button", { className: "lg:hidden inline-flex items-center justify-center bg-black text-[#ffc272] hover:bg-[#d9a556] rounded-lg p-2 hover:text-black transition-colors shadow-md", "aria-label": "Menu", onClick: () => setMenuOpen((v) => !v), children: menuOpen ? _jsx(X, { size: 22 }) : _jsx(Menu, { size: 22 }) }), !user ? (_jsx("button", { onClick: () => setShowLogin(true), className: "p-2 rounded-full bg-black text-[#ffc272] hover:text-white transition-colors shadow-md", "aria-label": "Se connecter", children: _jsx(User, { size: 20, className: "sm:w-6 sm:h-6" }) })) : (_jsx("button", { onClick: () => setShowLogoutModal(true), className: "p-2 sm:p-1 rounded-full bg-black  text-[#ffc272] hover:text-white transition-colors shadow-md", "aria-label": "D\u00E9connexion", children: _jsx(LogOut, { size: 20, className: "sm:w-8 sm:h-8 m-0 " }) }))] })] }), menuOpen && (_jsx("div", { className: "lg:hidden bg-black border-t border-[#2a2b2c] flex flex-col px-6 py-4 space-y-4", children: categories.map((cat) => (_jsx(Link, { to: `/produits?category=${encodeURIComponent(cat)}`, className: "hover:text-white transition-colors whitespace-nowrap", onClick: () => setMenuOpen(false), children: cat }, cat))) })), (showLogin || showSignUp) && !user && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50", children: _jsxs("form", { onSubmit: showLogin ? handleLogin : handleSignUp, className: "relative bg-gray-900 p-6 rounded-xl shadow-lg w-80 space-y-4", children: [_jsx("button", { type: "button", className: "absolute top-2 right-2 text-gray-400 hover:text-white", onClick: () => {
                                setShowLogin(false);
                                setShowSignUp(false);
                            }, "aria-label": "Fermer", children: "\u2715" }), _jsx("h2", { className: "text-2xl text-[#ffc272]", children: showLogin ? "Connexion" : "Créer un compte" }), _jsx("input", { type: "email", placeholder: showSignUp ? "Nouvelle adresse e-mail" : "Email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full p-2 rounded bg-gray-800 text-white" }), _jsx("input", { type: "password", placeholder: showSignUp ? "Nouveau mot de passe" : "Mot de passe", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full p-2 rounded bg-gray-800 text-white" }), _jsx("p", { className: "text-sm text-gray-400 mt-2", children: showLogin ? (_jsxs(_Fragment, { children: ["Pas de compte ?", " ", _jsx("button", { type: "button", className: "text-[#ffc272] hover:text-white", onClick: () => {
                                            setShowLogin(false);
                                            setShowSignUp(true);
                                        }, children: "Cr\u00E9er un compte" })] })) : (_jsxs(_Fragment, { children: ["D\u00E9j\u00E0 un compte ?", " ", _jsx("button", { type: "button", className: "text-[#ffc272] hover:text-white", onClick: () => {
                                            setShowSignUp(false);
                                            setShowLogin(true);
                                        }, children: "Connectez-vous" })] })) }), _jsxs("div", { className: "flex justify-between gap-2", children: [_jsx("button", { type: "button", onClick: () => {
                                        setShowLogin(false);
                                        setShowSignUp(false);
                                    }, className: "flex-1 text-black bg-[#b58545] py-2 rounded-lg", children: "Annuler" }), _jsx("button", { type: "submit", className: "flex-1 text-black bg-[#b58545] py-2 rounded-lg hover:bg-[#d9a556]", children: showLogin ? "Connexion" : "Créer" })] })] }) })), showLogoutModal && (_jsx("div", { className: "fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50", children: _jsxs("div", { className: "bg-gray-900 p-6 rounded-xl shadow-lg w-80 text-center", children: [_jsx("p", { className: "mb-4 text-[#ffc272]", children: "Voulez-vous vraiment vous d\u00E9connecter ?" }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx("button", { onClick: handleLogout, className: "px-4 py-2 bg-black text-[#ffc272] rounded hover:bg-[#dfc29d] hover:text-black transition-colors", children: "Oui" }), _jsx("button", { onClick: () => setShowLogoutModal(false), className: "px-4 py-2 bg-black text-[#ffc272] rounded hover:bg-[#dfc29d] hover:text-black transition-colors", children: "Non" })] })] }) }))] }));
}
