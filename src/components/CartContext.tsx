import { createContext, useContext } from "react";
import { useCart } from "./useCart";

export const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const cartHook = useCart();
  return <CartContext.Provider value={cartHook}>{children}</CartContext.Provider>;
};

export const useCartContext = () => useContext(CartContext);
