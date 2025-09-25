
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  colors: string[];
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
  color?: string;
}
