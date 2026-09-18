import { useCatalog } from "../context/CatalogContext";
import StatusBadge from "./StatusBadge";
import {
  STORE,
  formatDate,
  formatPrice,
  getDeliveryWindow,
} from "../config/store";

/**
 * Full breakdown of a single order: items, shipping details, payment and
 * totals. Shared by the order confirmation screen and the order details page so
 * both always show the same information.
 */
function OrderDetailView({ order }) {
  const { getProductById } = useCatalog();

  if (!order) {
    return null;
  }

  const billing = order.billingDetail;
  const payment = order.payment;
  const deliveryWindow = getDeliveryWindow(order.createdAt);

  const isPaid = payment?.status === "Paid";

  return (
    <div className="order-detail">
      <div className="order-detail-head">
        <div>
          <p className="eyebrow">Order</p>
          <h2 className="order-number">{order.orderNumber}</h2>
          <p className="muted">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="order-detail-badges">
          <StatusBadge status={order.status} label="Order" />
          {payment?.status && (
            <StatusBadge status={payment.status} label="Payment" />
          )}
        </div>
      </div>

      <div className="order-detail-grid">
        <section className="panel">
          <h3 className="panel-title">Items</h3>

          <ul className="order-items">
            {order.orderItems?.map((item) => {
              const product = getProductById(item.productId);

              return (
                <li className="order-item" key={item.orderItemId}>
                  <div className="order-item-thumb">
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={item.productName}
                        loading="lazy"
                      />
                    ) : (
                      <span aria-hidden="true">
                        {item.productName?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>

                  <div className="order-item-info">
                    <p className="order-item-name">{item.productName}</p>

                    <p className="muted">
                      Qty {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>

                  <p className="order-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>{formatPrice(order.deliveryCharge)}</span>
          </div>

          <div className="summary-row summary-row-total">
            <span>Total</span>
            <span>{formatPrice(order.grandTotal)}</span>
          </div>
        </section>

        <div className="order-detail-side">
          <section className="panel">
            <h3 className="panel-title">Shipping Details</h3>

            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{billing?.fullName || "—"}</dd>
              </div>

              <div>
                <dt>Address</dt>
                <dd>{billing?.address || "—"}</dd>
              </div>

              <div>
                <dt>City</dt>
                <dd>
                  {billing?.city || "—"}
                  {billing?.postalCode ? ` ${billing.postalCode}` : ""}
                </dd>
              </div>

              <div>
                <dt>Phone</dt>
                <dd>{billing?.phone || "—"}</dd>
              </div>

              <div>
                <dt>Email</dt>
                <dd>{billing?.email || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <h3 className="panel-title">Delivery</h3>

            <dl className="detail-list">
              <div>
                <dt>Sold by</dt>
                <dd>{STORE.soldBy}</dd>
              </div>

              <div>
                <dt>Shipped by</dt>
                <dd>{STORE.shippedBy}</dd>
              </div>

              <div>
                <dt>Method</dt>
                <dd>{STORE.shippingMethod}</dd>
              </div>

              <div>
                <dt>Shipping fee</dt>
                <dd>{formatPrice(order.deliveryCharge)}</dd>
              </div>

              {deliveryWindow && (
                <div>
                  <dt>Estimated delivery</dt>
                  <dd>{deliveryWindow.label}</dd>
                </div>
              )}
            </dl>

            <p className="fine-print">
              Delivery dates are an estimate based on the order date. Shopora
              does not yet track shipments with an external carrier.
            </p>
          </section>

          <section className="panel">
            <h3 className="panel-title">Payment</h3>

            <dl className="detail-list">
              <div>
                <dt>Method selected</dt>
                <dd>{payment?.method || "Not selected yet"}</dd>
              </div>

              <div>
                <dt>Payment status</dt>
                <dd>{payment?.status || "—"}</dd>
              </div>

              {payment?.paidAt && (
                <div>
                  <dt>Recorded at</dt>
                  <dd>{formatDate(payment.paidAt)}</dd>
                </div>
              )}
            </dl>

            <p className="fine-print">
              {isPaid
                ? "Marked as paid in the Shopora database. This is a test flow — no money has been taken through a real gateway."
                : "Payment will be collected on delivery."}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailView;
