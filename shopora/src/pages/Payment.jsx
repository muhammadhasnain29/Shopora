import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";
import OrderSummaryPanel from "../components/OrderSummaryPanel";
import { ErrorState, Spinner } from "../components/States";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { STORE, formatPrice } from "../config/store";

const PAYMENT_METHODS = [
  {
    value: "Cash on Delivery",
    label: "Cash on Delivery",
    description: "Pay the rider in cash when your order arrives.",
    note: "Your order is confirmed now and payment is collected on delivery.",
  },
  {
    value: "Bank Transfer",
    label: "Bank Transfer",
    description: "Record a bank transfer against this order.",
    note: "Test flow: the order is marked as paid in the Shopora database. No real payment gateway is connected.",
  },
];

/** Step 3 of the checkout: choosing how the order will be paid for. */
function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { userId } = useAuth();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [method, setMethod] = useState("Cash on Delivery");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const data = await api.getOrder(orderId, userId);

        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
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

  const handleConfirm = async (event) => {
    event.preventDefault();

    setConfirming(true);
    setError("");

    try {
      await api.confirmPayment(orderId, userId, method);

      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error("Confirm payment error:", err);

      const message =
        err.message || "Payment could not be confirmed. Please try again.";

      setError(message);
      showToast(message, "error");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="section-inner page-centered">
          <Spinner label="Loading your order…" />
        </div>
      </section>
    );
  }

  if (loadError || !order) {
    return (
      <section className="section">
        <div className="section-inner">
          <CheckoutSteps current={3} />
          <ErrorState message={loadError || "Order not found."} />

          <div className="center-row">
            <Link to="/orders" className="link-arrow">
              Go to my orders <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const lines = (order.orderItems || []).map((item) => ({
    key: item.orderItemId,
    productId: item.productId,
    name: item.productName,
    quantity: item.quantity,
    price: item.price,
  }));

  const selected = PAYMENT_METHODS.find((option) => option.value === method);

  return (
    <section className="section">
      <div className="section-inner">
        <CheckoutSteps current={3} />

        <div className="section-head">
          <div>
            <p className="eyebrow">Step 3 of 4 — order {order.orderNumber}</p>
            <h2>Payment</h2>
          </div>
        </div>

        <div className="checkout-layout">
          <form className="panel" onSubmit={handleConfirm}>
            <h3 className="panel-title">Choose a payment method</h3>

            {PAYMENT_METHODS.map((option) => (
              <label
                key={option.value}
                className={`payment-option${
                  method === option.value ? " payment-option-active" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={method === option.value}
                  onChange={(event) => setMethod(event.target.value)}
                />

                <div>
                  <strong>{option.label}</strong>
                  <p className="muted">{option.description}</p>
                </div>
              </label>
            ))}

            <div className="notice">
              <p>
                <strong>Payment method selected:</strong> {method}
              </p>

              <p className="muted">{selected?.note}</p>
            </div>

            <p className="fine-print">
              Nothing has been paid yet. Confirming below records your choice
              against the order in the Shopora database.
            </p>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={confirming}
            >
              {confirming
                ? "Confirming…"
                : method === "Cash on Delivery"
                ? "Confirm Order"
                : "Record Payment & Confirm"}
            </button>

            <div className="center-row">
              <Link to="/cart" className="link-arrow">
                <span aria-hidden="true">←</span> Back to cart
              </Link>
            </div>
          </form>

          <OrderSummaryPanel
            lines={lines}
            subtotal={order.subtotal}
            shipping={order.deliveryCharge}
            total={order.grandTotal}
            orderDate={order.createdAt}
            footer={
              <p className="fine-print">
                Sold by {STORE.soldBy}. Shipping fee{" "}
                {formatPrice(order.deliveryCharge)} is already included in the
                total above.
              </p>
            }
          />
        </div>
      </div>
    </section>
  );
}

export default Payment;
