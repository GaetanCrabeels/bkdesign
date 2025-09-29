export interface Product {
  id: string; // Identifiant unique (UUID ou ID auto-incrémenté côté BDD)
  title: string; // Nom du produit
  description: string; // Description complète
  price: number; // Prix unitaire
  image_url: string; // URL de l'image (cohérent avec une BDD)

  // 🆕 Catégorisation
  category: "Décoration" | "Fleurs" | "Cadre Plexi" | "Livres" | "Bougies décoratives";
  subcategory?: 
    | "Vases"
    | "Cadres / Miroirs / Horloges"
    | "Meubles"
    | "Couvertures d’ambiance"
    | "Bougies décoratives"
    | "Livres"
    | "Parfums d’intérieur"; // uniquement pour "Décoration"

  // 🆕 Gestion stock
  stock?: number; // Optionnel, peut être null si gestion externe
  created_at?: string; // Timestamp de création (utile si tu passes en base SQL)
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;

}