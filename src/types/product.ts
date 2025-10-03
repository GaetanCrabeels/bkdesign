export interface Product {
  id: string; // Identifiant unique
  title: string; 
  description: string; 
  price: number; 
  image_url: string; 

  // Catégories et sous-catégories
  category:
    | "Décoration"
    | "Bijoux"
    | "Encens"
    | "Parfum d’intérieur"
    | "Mode et accessoires"
    | "Beauté";
  subcategory?:
    | "Livres"
    | "Vases"
    | "Bougies"
    | "Fleurs artificielles"
    | "Cristaux Feng-Shui"
    | "Bracelet"
    | "Collier"
    | "Bague"
    | "Boucle d’oreille"
    | "Encens"
    | "Porte encens"
    | "Diffuseur"
    | "Bougie"
    | "Spray d’intérieur"
    | "Vestes"
    | "Sacs"
    | "Ceinture"
    | "Foulard"
    | "Écharpe"
    | "Bonnet"
    | "Casquette"
    | "Parapluie"
    | "Nettoyant visage"
    | "Exfoliant"
    | "Tonique"
    | "Contour des yeux"
    | "Crème usage"
    | "Masques";

  // Gestion stock
  stock?: number; 
  created_at?: string; 
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}
