"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  price: number;
  variant: string;
  quantity: number;
  storeUrl: string;
};

type State = { items: CartItem[] };
type Action =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; productId: string; variant: string }
  | { type: "UPDATE_QTY"; productId: string; variant: string; qty: number }
  | { type: "CLEAR" }
  | { type: "INIT"; items: CartItem[] };

function key(productId: string, variant: string) {
  return `${productId}::${variant}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INIT":
      return { items: action.items };
    case "ADD": {
      const k = key(action.item.productId, action.item.variant);
      const existing = state.items.find(
        (i) => key(i.productId, i.variant) === k
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            key(i.productId, i.variant) === k
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case "REMOVE":
      return {
        items: state.items.filter(
          (i) => key(i.productId, i.variant) !== key(action.productId, action.variant)
        ),
      };
    case "UPDATE_QTY":
      return {
        items: state.items
          .map((i) =>
            key(i.productId, i.variant) === key(action.productId, action.variant)
              ? { ...i, quantity: action.qty }
              : i
          )
          .filter((i) => i.quantity > 0),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (product: Product, variant: string) => void;
  removeItem: (productId: string, variant: string) => void;
  updateQty: (productId: string, variant: string, qty: number) => void;
  clear: () => void;
  whatsappCheckout: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const WHATSAPP_NUMBER = "5491100000000"; // TODO: replace with actual number

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("smile_cart");
      if (saved) dispatch({ type: "INIT", items: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("smile_cart", JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const count = state.items.reduce((s, i) => s + i.quantity, 0);
  const total = state.items.reduce((s, i) => s + i.price * i.quantity, 0);

  function addItem(product: Product, variant: string) {
    dispatch({
      type: "ADD",
      item: {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        subtitle: product.subtitle,
        image: product.images[0],
        price: product.price,
        variant,
        quantity: 1,
        storeUrl: product.storeUrl,
      },
    });
  }

  function removeItem(productId: string, variant: string) {
    dispatch({ type: "REMOVE", productId, variant });
  }

  function updateQty(productId: string, variant: string, qty: number) {
    dispatch({ type: "UPDATE_QTY", productId, variant, qty });
  }

  function clear() {
    dispatch({ type: "CLEAR" });
  }

  function whatsappCheckout() {
    if (state.items.length === 0) return;
    const lines = state.items.map(
      (i) => `• ${i.name} ${i.subtitle} (${i.variant}) x${i.quantity} — ${formatPrice(i.price * i.quantity)}`
    );
    const msg = encodeURIComponent(
      `Hola! Me gustaría comprar los siguientes productos de Smile:\n\n${lines.join("\n")}\n\nTotal: ${formatPrice(total)}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  }

  return (
    <CartContext.Provider
      value={{ items: state.items, count, total, addItem, removeItem, updateQty, clear, whatsappCheckout }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
