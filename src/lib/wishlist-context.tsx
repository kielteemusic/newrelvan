import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./session-context";

type WishlistValue = {
  productIds: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string, productName?: string) => void;
  signedIn: boolean;
};

const WishlistContext = createContext<WishlistValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  const [productIds, setProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) {
      setProductIds([]);
      return;
    }
    let active = true;
    supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (active) setProductIds((data ?? []).map((row) => row.product_id));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<WishlistValue>(
    () => ({
      productIds,
      signedIn: Boolean(userId),
      has: (productId) => productIds.includes(productId),
      toggle: (productId, productName) => {
        if (!userId) {
          toast.info("Sign in to save products to your wishlist.");
          return;
        }
        if (productIds.includes(productId)) {
          setProductIds((current) => current.filter((id) => id !== productId));
          void supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
          toast.success(`${productName ?? "Product"} removed from wishlist`);
          return;
        }
        setProductIds((current) => [...current, productId]);
        void supabase.from("wishlists").insert({ user_id: userId, product_id: productId });
        toast.success(`${productName ?? "Product"} saved to wishlist`);
      },
    }),
    [productIds, userId],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used within WishlistProvider");
  return value;
}
