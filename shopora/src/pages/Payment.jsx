import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = "http://localhost:5256/api";

const PAYMENT_METHODS = [
  {
    value: "Cash on Delivery",
    label: "Cash on Delivery",
    description: "Pay in cash when your order is delivered.",
  },
  {
    value: "Bank Transfer",
    label: "Bank Transfer",
    description: "Pay now via direct bank transfer.",
  },
];

function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState("Cash on Delivery");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/orders/${orderId}`);

        if (!response.ok) {
          throw new Error("Order not found.");
        }

        const data = await response.json();

        setOrder(data);
      } catch (err) {
        console.error("Payment order fetch error:", err);
        setError("Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();

    setConfirming(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/pay`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: method,
        }),
      });

      if (!response.ok) {
        throw new Error("Payment could not be confirmed. Please try again.");
      }

      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error("Confirm payment error:", err);
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <section className="products-section">
        <h1 className="loading">Loading order...</h1>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="products-section">
        <h1 className="loading">{error || "Order not found."}</h1>
      </section>
    );
  }

  return (
    <section className="products-section">
      <div className="section-heading">
        <p>ORDER {order.orderNumber}</p>
        <h2>Select Payment Method</h2>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleConfirmPayment}>
          <h3 className="checkout-subheading">Payment Method</h3>

          {PAYMENT_METHODS.map((option) => (
            <label
              key={option.value}
              className={
                "payment-option" +
                (method === option.value ? " payment-option-active" : "")
              }
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={method === option.value}
                onChange={(e) => setMethod(e.target.value)}
              />

              <div>
                <strong>{option.label}</strong>
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
                  {option.description}
                </p>
              </div>
            </label>
          ))}

          {error && (
            <p style={{ color: "red", marginTop: "15px" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={confirming}
            style={{ width: "100%", marginTop: "20px" }}
          >
            {confirming
              ? "Processing..."
              : method === "Cash on Delivery"
              ? "Confirm Order"
              : "Pay Now"}
          </button>
        </form>

        <div className="checkout-summary">
          <h3 className="checkout-subheading">Order Summary</h3>

          {order.orderItems.map((item) => (
            <div className="summary-line" key={item.orderItemId}>
              <span>
                {item.productName} <small>x{item.quantity}</small>
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <hr />

          <div className="summary-line">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-line">
            <span>Delivery Charges</span>
            <span>${order.deliveryCharge.toFixed(2)}</span>
          </div>

          <hr />

          <div className="summary-line summary-total">
            <span>Grand Total</span>
            <span>${order.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Payment;
