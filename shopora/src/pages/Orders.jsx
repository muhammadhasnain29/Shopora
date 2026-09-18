import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StatusBadge from "../components/StatusBadge";
import { ErrorState, StateMessage, Spinner } from "../components/States";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCatalog } from "../context/CatalogContext";
import { formatDate, formatPrice } from "../config/store";

/**
 * My Orders. Orders are always requested for the signed in user id, and the API
 * additionally refuses any order that belongs to someone else.
 */
function Orders() {
  const { userId } = useAuth();
  const { getProductById } = useCatalog();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await api.getOrdersForUser(userId);
      setOrders(data || []);
    } catch (err) {
      console.error("Orders load error:", err);
      setError(err.message || "Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await api.getOrdersForUser(userId);

        if (!cancelled) {
          setOrders(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Orders load error:", err);
          setError(
            err.message || "Unable to load your orders. Please try again."
          );
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

  return (
    <section className="section">
      <div className="section-inner">
        <div className="section-head">
          <div>
            <p className="eyebrow">Your account</p>
            <h2>My Orders</h2>
          </div>

          <Link to="/profile" className="link-arrow">
            View profile <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading && (
          <div className="page-centered">
            <Spinner label="Loading your orders…" />
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={loadOrders} />}

        {!loading && !error && orders.length === 0 && (
          <StateMessage
            icon="📦"
            title="You haven't placed any orders yet."
            description="When you place an order it will appear here with its status and receipt."
            actionLabel="Start Shopping"
            actionTo="/products"
          />
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-card" key={order.orderId}>
                <header className="order-card-head">
                  <div>
                    <p className="order-card-number">{order.orderNumber}</p>
                    <p className="muted">Placed on {formatDate(order.createdAt)}</p>
                  </div>

                  <div className="order-card-badges">
                    <StatusBadge status={order.status} label="Order" />

                    {order.payment?.status && (
                      <StatusBadge status={order.payment.status} label="Payment" />
                    )}
                  </div>
                </header>

                <ul className="order-card-items">
                  {(order.orderItems || []).map((item) => {
                    const product = getProductById(item.productId);

                    return (
                      <li key={item.orderItemId}>
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

                <footer className="order-card-foot">
                  <div>
                    <span className="meta-label">Order total</span>
                    <strong className="order-card-total">
                      {formatPrice(order.grandTotal)}
                    </strong>
                  </div>

                  <div className="order-card-actions">
                    {order.payment?.method ? null : (
                      <Link
                        to={`/payment/${order.orderId}`}
                        className="btn btn-outline"
                      >
                        Choose Payment
                      </Link>
                    )}

                    <Link
                      to={`/orders/${order.orderId}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Orders;
