import { useCatalog } from "../context/CatalogContext";
import { STORE, formatPrice, getDeliveryWindow } from "../config/store";

/**
 * The money panel shown on the cart, shipping and payment steps.
 *
 * `lines` is a normalised list of { key, productId, name, quantity, price } so
 * the same panel works for cart items and for order items.
 */
function OrderSummaryPanel({
  lines,
  subtotal,
  shipping,
  discount = 0,
  total,
  orderDate,
  showDeliveryInfo = true,
  footer,
}) {
  const { getProductById } = useCatalog();

  const deliveryWindow = getDeliveryWindow(orderDate);

  return (
    <aside className="summary-panel">
      <h3 className="panel-title">Order Summary</h3>

      <ul className="summary-items">
        {lines.map((line) => {
          const product = getProductById(line.productId);

          return (
            <li className="summary-item" key={line.key}>
              <div className="summary-thumb">
                {product?.image ? (
                  <img src={product.image} alt={line.name} loading="lazy" />
                ) : (
                  <span className="summary-thumb-fallback" aria-hidden="true">
                    {line.name?.charAt(0) || "?"}
                  </span>
                )}

                <span className="summary-qty">{line.quantity}</span>
              </div>

              <div className="summary-item-info">
                <p className="summary-item-name" title={line.name}>
                  {line.name}
                </p>

                <p className="summary-item-unit">
                  {formatPrice(line.price)} each
                </p>
              </div>

              <p className="summary-item-total">
                {formatPrice(line.price * line.quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="summary-divider" />

      <div className="summary-row">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>

      <div className="summary-row">
        <span>Shipping</span>
        <span>{formatPrice(shipping)}</span>
      </div>

      <div className="summary-row">
        <span>Discount</span>
        <span>{discount > 0 ? `− ${formatPrice(discount)}` : formatPrice(0)}</span>
      </div>

      <div className="summary-divider" />

      <div className="summary-row summary-row-total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {showDeliveryInfo && (
        <div className="summary-meta">
          <p>
            <span className="meta-label">Sold by</span>
            <span className="meta-value">{STORE.soldBy}</span>
          </p>

          <p>
            <span className="meta-label">Shipped by</span>
            <span className="meta-value">{STORE.shippedBy}</span>
          </p>

          <p>
            <span className="meta-label">Shipping</span>
            <span className="meta-value">{STORE.shippingMethod}</span>
          </p>

          {deliveryWindow && (
            <p>
              <span className="meta-label">Estimated delivery</span>
              <span className="meta-value">{deliveryWindow.label}</span>
            </p>
          )}
        </div>
      )}

      {footer}
    </aside>
  );
}

export default OrderSummaryPanel;
