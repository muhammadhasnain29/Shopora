import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";
import OrderSummaryPanel from "../components/OrderSummaryPanel";
import { ErrorState, StateMessage, Spinner } from "../components/States";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { STORE, formatPrice, getDeliveryWindow } from "../config/store";

/**
 * Step 2 of the checkout: where the order is going. The billing details
 * collected here are what the API stores on the order's BillingDetail record.
 */
function Checkout() {
  const navigate = useNavigate();

  const { user, userId } = useAuth();
  const { items, subtotal, cartId, loading, error, refresh } = useCart();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState("");

  // Prefill from the signed in account once it is known.
  useEffect(() => {
    setFullName((current) => current || user?.name || "");
    setEmail((current) => current || user?.email || "");
    setPhone((current) => current || user?.phone || "");
  }, [user]);

  const deliveryWindow = getDeliveryWindow();
  const total = subtotal + STORE.deliveryCharge;

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    setPlacing(true);
    setFormError("");

    try {
      const created = await api.createOrder({
        userId,
        cartId,
        fullName,
        email,
        phone,
        address,
        city,
        postalCode,
      });

      // The API empties the cart as part of creating the order.
      await refresh();

      navigate(`/payment/${created.orderId}`);
    } catch (err) {
      console.error("Place order error:", err);

      const message = err.message || "Failed to place order. Please try again.";

      setFormError(message);
      showToast(message, "error");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <section className="section">
        <div className="section-inner page-centered">
          <Spinner label="Loading checkout…" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="section-inner">
          <CheckoutSteps current={2} />
          <ErrorState message={error} onRetry={refresh} />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="section-inner">
          <CheckoutSteps current={2} />

          <StateMessage
            icon="🛒"
            title="Your cart is empty."
            description="Add something to your cart before checking out."
            actionLabel="Browse Products"
            actionTo="/products"
          />
        </div>
      </section>
    );
  }

  const lines = items.map((item) => ({
    key: item.cartItemId,
    productId: item.productId,
    name: item.productName,
    quantity: item.quantity,
    price: item.price,
  }));

  return (
    <section className="section">
      <div className="section-inner">
        <CheckoutSteps current={2} />

        <div className="section-head">
          <div>
            <p className="eyebrow">Step 2 of 4</p>
            <h2>Shipping Details</h2>
          </div>

          <Link to="/cart" className="link-arrow">
            <span aria-hidden="true">←</span> Back to cart
          </Link>
        </div>

        <div className="checkout-layout">
          <form className="panel form" onSubmit={handlePlaceOrder}>
            <h3 className="panel-title">Contact</h3>

            <div className="field">
              <label htmlFor="checkout-name">Full name</label>
              <input
                id="checkout-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="checkout-email">Email</label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label htmlFor="checkout-phone">Phone</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="03XXXXXXXXX"
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <h3 className="panel-title panel-title-spaced">Shipping address</h3>

            <div className="field">
              <label htmlFor="checkout-address">Address</label>
              <input
                id="checkout-address"
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="House / street / area"
                required
                autoComplete="street-address"
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="checkout-city">City</label>
                <input
                  id="checkout-city"
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="City"
                  required
                  autoComplete="address-level2"
                />
              </div>

              <div className="field">
                <label htmlFor="checkout-postal">Postal code</label>
                <input
                  id="checkout-postal"
                  type="text"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  placeholder="Postal code"
                  required
                  autoComplete="postal-code"
                />
              </div>
            </div>

            <h3 className="panel-title panel-title-spaced">Delivery method</h3>

            <div className="delivery-option">
              <span className="delivery-radio" aria-hidden="true" />

              <div>
                <strong>{STORE.shippingMethod}</strong>

                <p className="muted">
                  Shipped by {STORE.shippedBy}
                  {deliveryWindow ? ` — estimated ${deliveryWindow.label}` : ""}
                </p>
              </div>

              <span className="delivery-price">
                {formatPrice(STORE.deliveryCharge)}
              </span>
            </div>

            <p className="fine-print">
              Standard delivery is the only method Shopora offers today. Extra
              carriers can be added here once the API supports them.
            </p>

            {formError && <p className="form-error">{formError}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={placing}
            >
              {placing ? "Placing order…" : "Continue to Payment"}
            </button>
          </form>

          <OrderSummaryPanel
            lines={lines}
            subtotal={subtotal}
            shipping={STORE.deliveryCharge}
            total={total}
          />
        </div>
      </div>
    </section>
  );
}

export default Checkout;
