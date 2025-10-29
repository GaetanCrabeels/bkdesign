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
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produits" element={<Produits />} />
        <Route path="/produits/:subcategory" element={<Produits />} />
        <Route path="/confirm" element={<Confirm />} />
        <Route path="/produit/:id" element={<ProductPage />} />
        <Route path="/error" element={<Error />} />
        <Route path="*" element={<RedirectTo404 />} />
      </Routes>
    </CartProvider>
  );
}
