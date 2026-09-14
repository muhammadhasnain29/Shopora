import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_URL = "http://localhost:5256/api";

function OrderConfirmation() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error("Order confirmation fetch error:", err);
        setError("Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

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

  const billing = order.billingDetail;
  const payment = order.payment;

  const isPaid = payment?.status === "Paid";

  return (
    <section className="products-section">
      <div className="section-heading no-print">
        <p>THANK YOU</p>
        <h2>Order Confirmed</h2>
      </div>

      <div className="invoice">
        <div className="invoice-header">
          <div>
            <h2 style={{ marginBottom: "6px" }}>SHOPORA</h2>
            <p style={{ color: "#666" }}>Order Invoice / Challan</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p>
              <strong>Order #:</strong> {order.orderNumber}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  "status-badge " + (isPaid ? "status-paid" : "status-pending")
                }
              >
                {isPaid ? "PAID" : payment?.status?.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        <hr />

        <div className="invoice-columns">
          <div>
            <h3 className="checkout-subheading">Billing Details</h3>
            <p>{billing?.fullName}</p>
            <p>{billing?.email}</p>
            <p>{billing?.phone}</p>
            <p>
              {billing?.address}, {billing?.city} {billing?.postalCode}
            </p>
          </div>

          <div>
            <h3 className="checkout-subheading">Payment</h3>
            <p>
              <strong>Method:</strong> {payment?.method || "N/A"}
            </p>
            <p>
              <strong>Payment Status:</strong> {payment?.status}
            </p>
            <p>
              <strong>Order Status:</strong> {order.status}
            </p>
          </div>
        </div>

        <h3 className="checkout-subheading">Items</h3>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems.map((item) => (
              <tr key={item.orderItemId}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div className="summary-line">
            <span>Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Delivery Charges</span>
            <span>${order.deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="summary-line summary-total">
            <span>Grand Total</span>
            <span>${order.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="invoice-actions no-print">
        <button onClick={() => window.print()}>
          Download / Print Challan
        </button>

        <Link to="/products">
          <button className="secondary-btn">Continue Shopping</button>
        </Link>
      </div>
    </section>
  );
}

export default OrderConfirmation;
