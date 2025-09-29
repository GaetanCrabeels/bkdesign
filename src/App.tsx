import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Produits from "./pages/Products";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* route générale pour tous les produits */}
      <Route path="/produits" element={<Produits />} />
      {/* route pour une sous-catégorie spécifique */}
      <Route path="/produits/:subcategory" element={<Produits />} />
    </Routes>
  );
}
