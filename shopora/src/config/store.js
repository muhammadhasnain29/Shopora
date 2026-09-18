/**
 * Store level settings.
 *
 * Everything in here is Shopora's own configuration, NOT data that comes from
 * the backend. It lives in one place so that the day the API starts returning
 * real seller / carrier / shipping information, each value below can be swapped
 * for the API field without hunting through the UI.
 *
 * Nothing here pretends that an external courier has been contacted: the
 * delivery window is a store promise calculated from the real order date, and
 * the UI always labels it as an estimate.
 */

export const STORE = {
  name: "Shopora",
  tagline: "Everyday essentials, thoughtfully curated.",
  supportEmail: "support@shopora.example",

  // Currency symbol used across the UI. The seeded catalogue is priced in USD,
  // so change this only together with the prices in the database.
  currency: "$",

  // Shown on checkout / order pages. Replace with order.sellerName once the
  // backend supports multiple sellers.
  soldBy: "Shopora Store",

  // Replace with order.carrierName once the backend supports carriers.
  shippedBy: "Shopora Delivery",
  shippingMethod: "Standard Delivery",

  // Must stay in sync with OrdersController.DeliveryCharge on the API side.
  // The real charge always comes back on the order; this is only used to
  // preview the total before the order exists.
  deliveryCharge: 5.0,

  // Delivery window promised by the store, counted from the real order date.
  estimatedDeliveryDaysMin: 3,
  estimatedDeliveryDaysMax: 5,
};

/** Formats a number as a price, e.g. 5 -> "$5.00". */
export function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${STORE.currency}0.00`;
  }

  return `${STORE.currency}${amount.toFixed(2)}`;
}

/** Turns "men's clothing" into "Men's Clothing" for display. */
export function formatCategory(category) {
  if (!category) {
    return "";
  }

  return category
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Formats a date string as e.g. "12 Mar 2026". */
export function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Estimated delivery window, derived from the order's real creation date plus
 * the store's promised lead time. Returns null when there is no order date.
 */
export function getDeliveryWindow(orderDate) {
  const start = orderDate ? new Date(orderDate) : new Date();

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const from = new Date(start);
  from.setDate(from.getDate() + STORE.estimatedDeliveryDaysMin);

  const to = new Date(start);
  to.setDate(to.getDate() + STORE.estimatedDeliveryDaysMax);

  return {
    from,
    to,
    label: `${formatDate(from)} – ${formatDate(to)}`,
  };
}
