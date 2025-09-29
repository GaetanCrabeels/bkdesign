import { CartModal } from "../components/CartModal";
import { CartItem } from "../types/product";

export default function Produits() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // 🛒

  // ...

  return (
    <div className="min-h-screen bg-[#111213] text-[#ffc272]">
      <Header
        cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
        onOpenCart={() => setCartOpen(true)}
        query={query}
        setQuery={setQuery}
      />

      {/* reste de la page ... */}

      {cartOpen && (
        <CartModal
          items={cartItems}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
