import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { catalogQuery } from "./catalog-queries";
import { useSession } from "./session-context";
import type { Product } from "./catalog";

export type CartEntry = { productId: string; quantity: number };
export type CartLine = { product: Product; quantity: number };

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, quantity?: number) => void;
  update: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const storageKey = "relvan-lumina-cart";

function readLocal(): CartEntry[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const record = item as { productId?: string; quantity?: number; product?: { id?: string } };
        const productId = record.productId ?? record.product?.id;
        return productId ? { productId, quantity: Math.max(1, Number(record.quantity) || 1) } : null;
      })
      .filter((item): item is CartEntry => item !== null);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { userId, loading } = useSession();
  const { data: catalog } = useQuery(catalogQuery);
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [ready, setReady] = useState(false);
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    setEntries(readLocal());
    setReady(true);
  }, []);

  // Persist the guest cart locally so it survives a refresh.
  useEffect(() => {
    if (ready && !userId) window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, ready, userId]);

  // On sign-in, merge the local cart into the saved cart, then use the database.
  useEffect(() => {
    if (loading || !ready || !userId || mergedFor.current === userId) return;
    mergedFor.current = userId;
    let active = true;
    (async () => {
      const local = readLocal();
      const { data } = await supabase.from("cart_items").select("product_id, quantity").eq("user_id", userId);
      const remote = new Map((data ?? []).map((row) => [row.product_id, row.quantity]));
      for (const item of local) {
        remote.set(item.productId, (remote.get(item.productId) ?? 0) + item.quantity);
      }
      const merged = [...remote.entries()].map(([productId, quantity]) => ({ productId, quantity }));
      if (local.length) {
        await supabase
          .from("cart_items")
          .upsert(
            merged.map((item) => ({ user_id: userId, product_id: item.productId, quantity: item.quantity })),
            { onConflict: "user_id,product_id" },
          );
        window.localStorage.removeItem(storageKey);
      }
      if (active) setEntries(merged);
    })();
    return () => {
      active = false;
    };
  }, [userId, loading, ready]);

  useEffect(() => {
    if (!userId) mergedFor.current = null;
  }, [userId]);

  const persist = useCallback(
    async (next: CartEntry[], removedId?: string) => {
      if (!userId) return;
      if (removedId) {
        await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", removedId);
        return;
      }
      if (!next.length) {
        await supabase.from("cart_items").delete().eq("user_id", userId);
        return;
      }
      await supabase.from("cart_items").upsert(
        next.map((item) => ({ user_id: userId, product_id: item.productId, quantity: item.quantity })),
        { onConflict: "user_id,product_id" },
      );
    },
    [userId],
  );

  const items = useMemo(() => {
    const products = catalog?.products ?? [];
    return entries
      .map((entry) => {
        const product = products.find((item) => item.id === entry.productId);
        return product ? { product, quantity: entry.quantity } : null;
      })
      .filter((line): line is CartLine => line !== null);
  }, [entries, catalog]);

  const value = useMemo<CartContextValue>(() => {
    const apply = (next: CartEntry[], removedId?: string) => {
      setEntries(next);
      void persist(next, removedId);
    };
    return {
      items,
      count: entries.reduce((sum, entry) => sum + entry.quantity, 0),
      subtotal: items.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
      add: (product, quantity = 1) => {
        const found = entries.find((entry) => entry.productId === product.id);
        apply(
          found
            ? entries.map((entry) =>
                entry.productId === product.id ? { ...entry, quantity: entry.quantity + quantity } : entry,
              )
            : [...entries, { productId: product.id, quantity }],
        );
      },
      update: (productId, quantity) => {
        if (quantity < 1) {
          apply(entries.filter((entry) => entry.productId !== productId), productId);
          return;
        }
        apply(entries.map((entry) => (entry.productId === productId ? { ...entry, quantity } : entry)));
      },
      remove: (productId) => apply(entries.filter((entry) => entry.productId !== productId), productId),
      clear: () => {
        apply([]);
        window.localStorage.removeItem(storageKey);
      },
    };
  }, [entries, items, persist]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
