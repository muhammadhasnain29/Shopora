import { useCallback, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

function shorten(text, max = 40) {
  if (!text) {
    return "Item";
  }

  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

/**
 * One implementation of "add this product to the cart", shared by the product
 * cards and the product details page.
 *
 * A guest is asked to sign in first and the add is replayed automatically once
 * they do, so the visitor never has to click Add to Cart a second time.
 */
export function useAddToCart() {
  const { isAuthenticated, requireAuth } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [pendingProductId, setPendingProductId] = useState(null);

  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!product) {
        return;
      }

      const performAdd = async (signedInUser) => {
        setPendingProductId(product.id);

        try {
          await addItem(product.id, quantity, signedInUser?.userId);

          showToast(`${shorten(product.title)} added to your cart.`);
        } catch (error) {
          console.error("Add to cart failed:", error);

          showToast(
            error.message || "Could not add this item to your cart.",
            "error"
          );
        } finally {
          setPendingProductId(null);
        }
      };

      if (!isAuthenticated) {
        requireAuth({
          message: "Sign in to add items to your cart.",
          action: performAdd,
        });

        return;
      }

      await performAdd();
    },
    [addItem, isAuthenticated, requireAuth, showToast]
  );

  return { addToCart, pendingProductId };
}

export default useAddToCart;
