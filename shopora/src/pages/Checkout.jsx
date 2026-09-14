import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5256/api";
const DELIVERY_CHARGE = 5.0;

function Checkout({ refreshCartCount }) {
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(
    localStorage.getItem("shoporaUser") || "null"
  );

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(loggedInUser?.name || "");
  const [email, setEmail] = useState(loggedInUser?.email || "");
  const [phone, setPhone] = useState(loggedInUser?.phone || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  useEffect(() => {
    if (!loggedInUser) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/cart/${loggedInUser.cartId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load cart");
        }

        const data = await response.json();

        setCart(data);
      } catch (err) {
        console.error("Checkout cart error:", err);
        setError("Unable to load your cart. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loggedInUser) {
    return null;
  }

  if (loading) {
    return (
      <section className="products-section">
        <h1 className="loading">Loading checkout...</h1>
      </section>
    );
  }

  if (!cart || cart.cartItems.length === 0) {
    return (
      <section className="products-section">
        <div className="section-heading">
          <p>CHECKOUT</p>
          <h2>Your cart is empty</h2>
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={() => navigate("/products")}>
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  const subtotal = cart.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const grandTotal = subtotal + DELIVERY_CHARGE;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    setPlacing(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: loggedInUser.userId,
          cartId: loggedInUser.cartId,
          fullName,
          email,
          phone,
          address,
          city,
          postalCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Order creation failed:", errorText);
        throw new Error("Failed to place order. Please try again.");
      }

      const data = await response.json();

      if (refreshCartCount) {
        await refreshCartCount();
      }

      navigate(`/payment/${data.orderId}`);
    } catch (err) {
      console.error("Place order error:", err);
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <section className="products-section">
      <div className="section-heading">
        <p>SECURE CHECKOUT</p>
        <h2>Checkout</h2>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handlePlaceOrder}>
          <h3 className="checkout-subheading">Billing Information</h3>

          <div style={{ marginBottom: "16px" }}>
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XXXXXXXXX"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <h3 className="checkout-subheading">Billing Address</h3>

          <div style={{ marginBottom: "16px" }}>
            <label>Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House / Street / Area"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div className="checkout-row">
            <div style={{ marginBottom: "16px", flex: 1 }}>
              <label>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px", flex: 1 }}>
              <label>Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal Code"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>
          )}

          <button type="submit" disabled={placing} style={{ width: "100%" }}>
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        <div className="checkout-summary">
          <h3 className="checkout-subheading">Order Summary</h3>

          {cart.cartItems.map((item) => (
            <div className="summary-line" key={item.cartItemId}>
              <span>
                {item.productName} <small>x{item.quantity}</small>
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}

          <hr />

          <div className="summary-line">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-line">
            <span>Delivery Charges</span>
            <span>${DELIVERY_CHARGE.toFixed(2)}</span>
          </div>

          <hr />

          <div className="summary-line summary-total">
            <span>Grand Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Checkout;
