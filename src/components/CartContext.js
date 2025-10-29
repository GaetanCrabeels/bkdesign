import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { useCart } from "./useCart";
export const CartContext = createContext(null);
export const CartProvider = ({ children }) => {
    const cartHook = useCart();
    return _jsx(CartContext.Provider, { value: cartHook, children: children });
};
export const useCartContext = () => useContext(CartContext);
