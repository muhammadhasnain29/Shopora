import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";
import OrderDetailView from "../components/OrderDetailView";
import { ErrorState, Spinner } from "../components/States";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { STORE, formatPrice, getDeliveryWindow } from "../config/store";

/** Step 4: the success screen shown right after an order is placed. */
function OrderConfirmation() {
  const { orderId } = useParams();
  const { userId } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api.getOrder(orderId, userId);

        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.status === 403
              ? "This order belongs to a different account."
              : err.message || "Unable to load this order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (userId) {
      loadOrder();
    }

    return () => {
      cancelled = true;
    };
  }, [orderId, userId]);

  if (loading) {
    return (
      <section className="section">
        <div className="section-inner page-centered">
          <Spinner label="Loading your order…" />
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="section">
        <div className="section-inner">
          <ErrorState message={error || "Order not found."} />
        </div>
      </section>
    );
  }

  const deliveryWindow = getDeliveryWindow(order.createdAt);

  return (
    <section className="section">
      <div className="section-inner">
        <CheckoutSteps current={4} />

        <div className="confirmation-hero">
          <span className="confirmation-check" aria-hidden="true">
            ✓
          </span>

          <h2>Order placed successfully!</h2>

          <p className="muted">
            Thank you for shopping with {STORE.name}.
          </p>

          <div className="confirmation-facts">
            <div>
              <span className="meta-label">Order number</span>
              <span className="meta-value">{order.orderNumber}</span>
            </div>

            {deliveryWindow && (
              <div>
                <span className="meta-label">Estimated delivery</span>
                <span className="meta-value">{deliveryWindow.label}</span>
              </div>
            )}

            <div>
              <span className="meta-label">Total paid / due</span>
              <span className="meta-value">{formatPrice(order.grandTotal)}</span>
            </div>
          </div>

          <div className="confirmation-actions no-print">
            <Link to={`/orders/${order.orderId}`} className="btn btn-primary btn-lg">
              View Order
            </Link>

            <Link to="/products" className="btn btn-outline btn-lg">
              Continue Shopping
            </Link>

            <button
              type="button"
              className="btn btn-ghost btn-lg"
              onClick={() => window.print()}
            >
              Print Receipt
            </button>
          </div>
        </div>

        <OrderDetailView order={order} />
      </div>
    </section>
  );
}

export default OrderConfirmation;
