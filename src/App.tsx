import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Produits from "./pages/Products";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/produits" element={<Produits />} />
    </Routes>
  );
}
