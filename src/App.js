import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Produits from "./pages/Products";
import Confirm from "./pages/Confirm";
import Error from "./pages/Error";
import ProductPage from './components/ProductPage';
import { CartProvider } from './components/CartContext';
function RedirectTo404() {
    window.location.href = "https://bkdesign.be/404";
    return null;
}
export default function App() {
    return (_jsx(CartProvider, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/produits", element: _jsx(Produits, {}) }), _jsx(Route, { path: "/produits/:subcategory", element: _jsx(Produits, {}) }), _jsx(Route, { path: "/confirm", element: _jsx(Confirm, {}) }), _jsx(Route, { path: "/produit/:id", element: _jsx(ProductPage, {}) }), _jsx(Route, { path: "/error", element: _jsx(Error, {}) }), _jsx(Route, { path: "*", element: _jsx(RedirectTo404, {}) })] }) }));
}
