import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, { normalizeProduct } from "../api/client";

const CatalogContext = createContext(null);

const FALLBACK_URL = "https://fakestoreapi.com/products";

/**
 * Holds the product catalogue for the whole app.
 *
 * The Shopora API is the source of truth, because cart items and order items
 * reference product ids from that database. If the API cannot be reached the
 * public FakeStore catalogue is used so the storefront still renders something,
 * but in that mode the ids may not line up with the database and adding to the
 * cart will surface the API's own error.
 */
export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingFallback, setUsingFallback] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [apiProducts, apiCategories] = await Promise.all([
        api.getProducts(),
        api.getCategories().catch(() => null),
      ]);

      const normalized = (apiProducts || []).map(normalizeProduct);

      if (normalized.length === 0) {
        throw new Error(
          "The product catalogue is empty. Run POST /api/products/import once to seed it."
        );
      }

      setProducts(normalized);
      setUsingFallback(false);

      setCategories(
        apiCategories && apiCategories.length > 0
          ? apiCategories
          : [...new Set(normalized.map((p) => p.category))].filter(Boolean).sort()
      );
    } catch (apiError) {
      console.error("Catalogue load error:", apiError);

      // Last resort so the storefront is not a blank page while the API is down.
      try {
        const response = await fetch(FALLBACK_URL);

        if (!response.ok) {
          throw new Error("Fallback catalogue unavailable.");
        }

        const data = await response.json();
        const normalized = (data || []).map(normalizeProduct);

        setProducts(normalized);
        setCategories(
          [...new Set(normalized.map((p) => p.category))].filter(Boolean).sort()
        );
        setUsingFallback(true);
        setError("");
      } catch (fallbackError) {
        console.error("Fallback catalogue error:", fallbackError);

        setProducts([]);
        setCategories([]);
        setUsingFallback(false);
        setError(
          apiError.message ||
            "Unable to load products. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getProductById = useCallback(
    (id) => products.find((product) => product.id === Number(id)) || null,
    [products]
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      usingFallback,
      reload: load,
      getProductById,
    }),
    [products, categories, loading, error, usingFallback, load, getProductById]
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error("useCatalog must be used inside a CatalogProvider.");
  }

  return context;
}

export default CatalogContext;
