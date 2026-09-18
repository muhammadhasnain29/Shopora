import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import CheckoutSteps from "../components/CheckoutSteps";
import OrderSummaryPanel from "../components/OrderSummaryPanel";
import QuantityStepper from "../components/QuantityStepper";
import { ErrorState, StateMessage, Spinner } from "../components/States";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useToast } from "../context/ToastContext";
import { STORE, formatPrice } from "../config/store";

function Cart() {
  const navigate = useNavigate();

  const { isAuthenticated, initializing, requireAuth } = useAuth();
  const { items, subtotal, loading, error, updateQuantity, removeItem, refresh } =
    useCart();
  const { getProductById } = useCatalog();
  const { showToast } = useToast();

  const [busyItemId, setBusyItemId] = useState(null);

  const handleQuantity = async (item, quantity) => {
    setBusyItemId(item.cartItemId);

    try {
      await updateQuantity(item.cartItemId, quantity);
    } catch (err) {
      showToast(err.message || "Could not update quantity.", "error");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyItemId(item.cartItemId);

    try {
      await removeItem(item.cartItemId);
      showToast("Item removed from your cart.");
    } catch (err) {
      showToast(err.message || "Could not remove this item.", "error");
    } finally {
      setBusyItemId(null);
    }
  };

  if (initializing) {
    return (
      <section className="section">
        <div className="section-inner page-centered">
          <Spinner label="Loading your cart…" />
        </div>
      </section>
    );
  }

  // ---- Guest ----------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <section className="section">
        <div className="section-inner">
          <CheckoutSteps current={1} />

          <StateMessage
            icon="🛒"
            title="Sign in to see your cart"
            description="Your cart is saved to your Shopora account, so it is waiting for you when you come back."
            actionLabel="Login or Register"
            onAction={() =>
              requireAuth({ message: "Sign in to view your cart." })
            }
          />

          <div className="center-row">
            <Link to="/products" className="link-arrow">
              Continue shopping <span aria-hidden="true">→</span>
            </Link>
          </div>
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

  const total = subtotal + (items.length > 0 ? STORE.deliveryCharge : 0);

  return (
    <section className="section">
      <div className="section-inner">
        <CheckoutSteps current={1} />

        <div className="section-head">
          <div>
            <p className="eyebrow">Step 1 of 4</p>
            <h2>Your Cart</h2>
          </div>
        </div>

        {loading && (
          <div className="page-centered">
            <Spinner label="Loading your cart…" />
          </div>
        )}

        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && items.length === 0 && (
          <StateMessage
            icon="🛒"
            title="Your cart is empty."
            description="Browse the store and add a few things you like."
            actionLabel="Start Shopping"
            actionTo="/products"
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => {
                const product = getProductById(item.productId);
                const isBusy = busyItemId === item.cartItemId;

                return (
                  <article
                    className={`cart-row${isBusy ? " is-busy" : ""}`}
                    key={item.cartItemId}
                  >
                    <Link
                      to={`/products/${item.productId}`}
                      className="cart-thumb"
                    >
                      {product?.image ? (
                        <img src={product.image} alt={item.productName} />
                      ) : (
                        <span aria-hidden="true">
                          {item.productName?.charAt(0) || "?"}
                        </span>
                      )}
                    </Link>

                    <div className="cart-row-info">
                      <h3>
                        <Link to={`/products/${item.productId}`}>
                          {item.productName}
                        </Link>
                      </h3>

                      <p className="muted">
                        {formatPrice(item.price)} each
                      </p>

                      <button
                        type="button"
                        className="link-danger"
                        onClick={() => handleRemove(item)}
                        disabled={isBusy}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="cart-row-qty">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(quantity) => handleQuantity(item, quantity)}
                        disabled={isBusy}
                        size="sm"
                      />
                    </div>

                    <p className="cart-row-total">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </article>
                );
              })}

              <div className="cart-footer">
                <Link to="/products" className="link-arrow">
                  <span aria-hidden="true">←</span> Continue shopping
                </Link>
              </div>
            </div>

            <OrderSummaryPanel
              lines={lines}
              subtotal={subtotal}
              shipping={STORE.deliveryCharge}
              total={total}
              footer={
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Shipping
                </button>
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default Cart;
