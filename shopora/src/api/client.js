/**
 * Single place where the frontend talks to the Shopora API.
 *
 * Every endpoint used by the app is declared here so that API paths, error
 * handling and the "who is asking" user id are not scattered across components.
 */

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5256/api";

/** Error carrying the HTTP status so callers can react to 403 / 404. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Appends a query string, skipping null/undefined/empty values. */
function withQuery(path, params) {
  if (!params) {
    return path;
  }

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `${path}?${queryString}` : path;
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    // Network level failure: the API is not running or not reachable.
    throw new ApiError(
      "Unable to reach the Shopora server. Please check your connection and try again.",
      0
    );
  }

  const rawBody = await response.text();

  let body = null;

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === "string" && body
        ? body
        : body?.message || `Request failed (${response.status}).`;

    throw new ApiError(message, response.status);
  }

  return body;
}

const get = (path, params) => request(withQuery(path, params));

const post = (path, data, params) =>
  request(withQuery(path, params), {
    method: "POST",
    body: JSON.stringify(data),
  });

const put = (path, data, params) =>
  request(withQuery(path, params), {
    method: "PUT",
    body: JSON.stringify(data),
  });

const del = (path, params) =>
  request(withQuery(path, params), { method: "DELETE" });

/**
 * The API returns a flat product (ratingRate / ratingCount) while the public
 * FakeStore catalogue nests rating. Both are normalised to one shape so the
 * components never have to care where a product came from.
 */
export function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    title: product.title || "",
    price: Number(product.price) || 0,
    description: product.description || "",
    category: product.category || "",
    image: product.image || "",
    rating: {
      rate: Number(product.rating?.rate ?? product.ratingRate ?? 0),
      count: Number(product.rating?.count ?? product.ratingCount ?? 0),
    },
  };
}

export const api = {
  // ---- Auth ----------------------------------------------------------
  login: (email, password) => post("/auth/login", { email, password }),

  register: (details) => post("/auth/register", details),

  /** Re-validates a remembered session against the database. */
  getCurrentUser: (userId) => get(`/auth/me/${userId}`),

  // ---- Products ------------------------------------------------------
  getProducts: (filters) => get("/products", filters),

  getProduct: (id) => get(`/products/${id}`),

  getCategories: () => get("/products/categories"),

  getRelatedProducts: (id, take = 4) => get(`/products/${id}/related`, { take }),

  // ---- Cart ----------------------------------------------------------
  /** Resolves (or creates) the cart that belongs to this user. */
  getCartForUser: (userId) => get(`/cart/user/${userId}`),

  getCart: (cartId, userId) => get(`/cart/${cartId}`, { userId }),

  addCartItem: (cartId, userId, productId, quantity) =>
    post(`/cart/${cartId}/items`, { productId, quantity }, { userId }),

  updateCartItem: (cartItemId, userId, quantity) =>
    put(`/cart/items/${cartItemId}`, quantity, { userId }),

  removeCartItem: (cartItemId, userId) =>
    del(`/cart/items/${cartItemId}`, { userId }),

  // ---- Orders --------------------------------------------------------
  createOrder: (order) => post("/orders", order),

  getOrder: (orderId, userId) => get(`/orders/${orderId}`, { userId }),

  getOrdersForUser: (userId) => get(`/orders/user/${userId}`),

  confirmPayment: (orderId, userId, paymentMethod) =>
    put(`/orders/${orderId}/pay`, { paymentMethod }, { userId }),
};

export default api;
