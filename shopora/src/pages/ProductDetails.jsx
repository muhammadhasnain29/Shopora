import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import QuantityStepper from "../components/QuantityStepper";
import Rating from "../components/Rating";
import { LineSkeleton, StateMessage } from "../components/States";
import api, { normalizeProduct } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useToast } from "../context/ToastContext";
import useAddToCart from "../hooks/useAddToCart";
import { STORE, formatCategory, formatPrice, getDeliveryWindow } from "../config/store";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { products, loading: catalogLoading, getProductById } = useCatalog();
  const { addToCart, pendingProductId } = useAddToCart();
  const { isAuthenticated, requireAuth } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [fetched, setFetched] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [buying, setBuying] = useState(false);

  const fromCatalog = getProductById(id);
  const product = fromCatalog || fetched;

  // Reset the local state when navigating between products.
  useEffect(() => {
    setQuantity(1);
    setZoomed(false);
    setNotFound(false);
    setFetched(null);
  }, [id]);

  // If the product is not part of the loaded catalogue, ask the API directly.
  useEffect(() => {
    let cancelled = false;

    if (fromCatalog || catalogLoading) {
      return undefined;
    }

    const load = async () => {
      setFetching(true);

      try {
        const data = await api.getProduct(id);

        if (!cancelled) {
          setFetched(normalizeProduct(data));
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
        }
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, fromCatalog, catalogLoading]);

  const related = useMemo(() => {
    if (!product) {
      return [];
    }

    return products
      .filter(
        (item) => item.category === product.category && item.id !== product.id
      )
      .slice(0, 4);
  }, [products, product]);

  const deliveryWindow = getDeliveryWindow();

  if (catalogLoading || fetching) {
    return (
      <section className="section">
        <div className="section-inner">
          <div className="product-detail">
            <div className="skeleton skeleton-hero" aria-hidden="true" />

            <div>
              <LineSkeleton rows={6} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (notFound || !product) {
    return (
      <section className="section">
        <div className="section-inner">
          <StateMessage
            icon="?"
            title="Product not found"
            description="This product may have been removed or the link is incorrect."
            actionLabel="Back to Products"
            actionTo="/products"
          />
        </div>
      </section>
    );
  }

  const lineTotal = product.price * quantity;

  const handleBuyNow = () => {
    const performBuy = async (signedInUser) => {
      setBuying(true);

      try {
        await addItem(product.id, quantity, signedInUser?.userId);
        navigate("/checkout");
      } catch (error) {
        console.error("Buy now failed:", error);
        showToast(error.message || "Could not start checkout.", "error");
      } finally {
        setBuying(false);
      }
    };

    if (!isAuthenticated) {
      requireAuth({
        message: "Sign in to complete your purchase.",
        action: performBuy,
      });

      return;
    }

    performBuy();
  };

  const isAdding = pendingProductId === product.id;

  return (
    <>
      <section className="section">
        <div className="section-inner">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/products">Products</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
              {formatCategory(product.category)}
            </Link>
          </nav>

          <div className="product-detail">
            {/* ---- Left: imagery ---- */}
            <div className="product-gallery">
              <button
                type="button"
                className={`gallery-main${zoomed ? " gallery-zoomed" : ""}`}
                onClick={() => setZoomed((value) => !value)}
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
              >
                <img src={product.image} alt={product.title} />
              </button>

              <p className="gallery-hint">
                {zoomed ? "Click the image to zoom out" : "Click the image to zoom"}
              </p>
            </div>

            {/* ---- Right: buying panel ---- */}
            <div className="product-buy">
              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="pill"
              >
                {formatCategory(product.category)}
              </Link>

              <h1 className="product-title">{product.title}</h1>

              <div className="product-rating-row">
                <Rating
                  rate={product.rating.rate}
                  count={product.rating.count}
                  size="md"
                  showCount={false}
                />

                <span className="muted">
                  {product.rating.count > 0
                    ? `${product.rating.count.toLocaleString()} ratings`
                    : "No ratings yet"}
                </span>
              </div>

              <p className="product-price">{formatPrice(product.price)}</p>

              <p className="product-availability">
                <span className="dot dot-success" aria-hidden="true" />
                In stock — ready to ship
              </p>

              <p className="product-short-desc">{product.description}</p>

              <div className="buy-row">
                <div>
                  <span className="field-label">Quantity</span>

                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    disabled={isAdding || buying}
                  />
                </div>

                <div className="buy-total">
                  <span className="field-label">Total</span>
                  <strong>{formatPrice(lineTotal)}</strong>
                </div>
              </div>

              <div className="buy-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => addToCart(product, quantity)}
                  disabled={isAdding || buying}
                >
                  {isAdding ? "Adding…" : "Add to Cart"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={handleBuyNow}
                  disabled={isAdding || buying}
                >
                  {buying ? "Please wait…" : "Buy Now"}
                </button>
              </div>

              <ul className="buy-meta">
                <li>
                  <span className="meta-label">Sold by</span>
                  <span className="meta-value">{STORE.soldBy}</span>
                </li>

                <li>
                  <span className="meta-label">Shipped by</span>
                  <span className="meta-value">{STORE.shippedBy}</span>
                </li>

                <li>
                  <span className="meta-label">Shipping</span>
                  <span className="meta-value">
                    {STORE.shippingMethod} — {formatPrice(STORE.deliveryCharge)}
                  </span>
                </li>

                {deliveryWindow && (
                  <li>
                    <span className="meta-label">Estimated delivery</span>
                    <span className="meta-value">{deliveryWindow.label}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Below the fold ---- */}
      <section className="section section-muted">
        <div className="section-inner">
          <div className="info-grid">
            <div className="panel">
              <h3 className="panel-title">Product Description</h3>
              <p className="prose">{product.description}</p>
            </div>

            <div className="panel">
              <h3 className="panel-title">Product Information</h3>

              <dl className="detail-list">
                <div>
                  <dt>Product ID</dt>
                  <dd>#{product.id}</dd>
                </div>

                <div>
                  <dt>Category</dt>
                  <dd>{formatCategory(product.category)}</dd>
                </div>

                <div>
                  <dt>Price</dt>
                  <dd>{formatPrice(product.price)}</dd>
                </div>

                <div>
                  <dt>Average rating</dt>
                  <dd>
                    {product.rating.count > 0
                      ? `${product.rating.rate.toFixed(1)} / 5`
                      : "Not rated yet"}
                  </dd>
                </div>

                <div>
                  <dt>Ratings received</dt>
                  <dd>{product.rating.count.toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="panel rating-panel">
            <h3 className="panel-title">Customer Ratings</h3>

            {product.rating.count > 0 ? (
              <div className="rating-summary">
                <div className="rating-score">
                  <strong>{product.rating.rate.toFixed(1)}</strong>
                  <span>out of 5</span>
                </div>

                <div>
                  <Rating
                    rate={product.rating.rate}
                    count={product.rating.count}
                    size="lg"
                    showCount={false}
                  />

                  <p className="muted">
                    Based on {product.rating.count.toLocaleString()} ratings.
                  </p>
                </div>
              </div>
            ) : (
              <p className="muted">
                This product has not been rated yet.
              </p>
            )}

            <p className="fine-print">
              Shopora stores an average rating and a rating count per product.
              Written reviews are not collected yet.
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="eyebrow">You may also like</p>
                <h2>Related products</h2>
              </div>

              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="link-arrow"
              >
                More in {formatCategory(product.category)}{" "}
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="products-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default ProductDetails;
