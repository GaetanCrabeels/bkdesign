import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Produits from "./pages/Products";
import Confirm from "./pages/Confirm";
import Error from "./pages/Error";
import Cancel from "./pages/Cancel";
function RedirectTo404() {
  // redirection externe vers WP
  window.location.href = "https://bkdesign.be/404";
  return null;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/produits" element={<Produits />} />
      <Route path="/produits/:subcategory" element={<Produits />} />
    ; <Route path="/confirm" element={<Confirm />} />
        <Route path="/error" element={<Error />} />
        <Route path="/cancel" element={<Cancel />} />
      {/* catch-all vers WP */}
      <Route path="*" element={<RedirectTo404 />} />

    </Routes>
  );
}
