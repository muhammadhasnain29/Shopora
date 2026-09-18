import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const EMPTY_ITEMS = [];

export function CartProvider({ children }) {
  const { userId, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Loads the cart that belongs to the signed in user. The CartId always comes
   * from the server for the current user id, never from stored state, so the
   * cart can never carry over from a previous account.
   */
  const loadCart = useCallback(async () => {
    if (!userId) {
      setCart(null);
      setError("");
      return null;
    }

    try {
      setLoading(true);
      setError("");

      const data = await api.getCartForUser(userId);

      setCart(data);

      return data;
    } catch (err) {
      console.error("Cart load error:", err);

      setCart(null);
      setError(err.message || "Unable to load your cart.");

      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refetch whenever the signed in user changes, and clear on logout.
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setCart(null);
      setError("");
      setLoading(false);
      return undefined;
    }

    const run = async () => {
      setLoading(true);

      try {
        const data = await api.getCartForUser(userId);

        if (!cancelled) {
          setCart(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Cart load error:", err);
          setCart(null);
          setError(err.message || "Unable to load your cart.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const items = cart?.cartItems || EMPTY_ITEMS;

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  /**
   * Adds a product to the signed in user's cart. The cart is resolved from the
   * server first when it is not loaded yet, which covers the case where a guest
   * has just signed in and the pending "add to cart" action replays.
   */
  const addItem = useCallback(
    async (productId, quantity = 1, explicitUserId) => {
      const activeUserId = explicitUserId || userId;

      if (!activeUserId) {
        throw new Error("You need to be signed in to add items to your cart.");
      }

      const activeCart =
        cart && cart.userId === activeUserId
          ? cart
          : await api.getCartForUser(activeUserId);

      await api.addCartItem(
        activeCart.cartId,
        activeUserId,
        productId,
        quantity
      );

      const refreshed = await api.getCartForUser(activeUserId);

      setCart(refreshed);

      return refreshed;
    },
    [cart, userId]
  );

  const updateQuantity = useCallback(
    async (cartItemId, quantity) => {
      if (!userId || quantity < 1) {
        return;
      }

      await api.updateCartItem(cartItemId, userId, quantity);
      await loadCart();
    },
    [userId, loadCart]
  );

  const removeItem = useCallback(
    async (cartItemId) => {
      if (!userId) {
        return;
      }

      await api.removeCartItem(cartItemId, userId);
      await loadCart();
    },
    [userId, loadCart]
  );

  const value = useMemo(
    () => ({
      cart,
      cartId: cart?.cartId ?? null,
      items,
      count,
      subtotal,
      loading,
      error,
      isAuthenticated,
      addItem,
      updateQuantity,
      removeItem,
      refresh: loadCart,
    }),
    [
      cart,
      items,
      count,
      subtotal,
      loading,
      error,
      isAuthenticated,
      addItem,
      updateQuantity,
      removeItem,
      loadCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider.");
  }

  return context;
}

export default CartContext;
