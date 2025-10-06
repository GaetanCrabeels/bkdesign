
export interface Product {
  id: string; // Identifiant unique
  title: string; 
  description: string; 
  price: number;  // Prix par défaut si pas de variantes
  image_url: string; 

  // Catégories et sous-catégories
  category: string;
  subcategory?: string;

  // Gestion total_quantity
  total_quantity?: number; // facultatif si variants
  created_at?: string; 

  // Variantes disponibles
}
export interface ProductVariant {
  id: string;          // UUID unique de la variante
  produit_id: string;   // UUID du produit parent
  taille: string;       // Taille, ex: S, M, L
  promotion: number;    // Pourcentage de promo (int)
  poids: number;        // Poids en grammes
  quantity: number;     // Stock disponible
  created_at?: string;  // Date de création
}

export interface CartItem {
  id: string;           // ID unique dans le panier (ou product.id)
  title: string;
  price: number;        // Prix calculé selon promo si applicable
  qty: number;
  variantKey?: string;  // taille ou id variante pour différencier les variantes
  variant?: ProductVariant; // Variante complète pour calcul du prix/promo
}
