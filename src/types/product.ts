export interface ProductVariant {
  id: string;           // Identifiant unique de la variante
  produit_id: string;   // Id du produit parent
  taille: string;       // Taille ou type de variante
  prix: number;         // Prix spécifique à cette variante
  quantity: number;        // total_quantity de cette variante
}

export interface Product {
  id: string; // Identifiant unique
  title: string; 
  description: string; 
  price: number;  // Prix par défaut si pas de variantes
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

  // Gestion total_quantity
  total_quantity?: number; // facultatif si variants
  created_at?: string; 

  // Variantes disponibles
  variants?: ProductVariant[];
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
  variantKey?: string; // taille ou id variante pour différencier L, XL, etc.
}
