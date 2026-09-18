import { Link } from "react-router-dom";

import Rating from "./Rating";
import useAddToCart from "../hooks/useAddToCart";
import { formatCategory, formatPrice } from "../config/store";

/**
 * A single product tile. Every card is the same height regardless of how long
 * the title is, and the image is contained rather than stretched.
 */
function ProductCard({ product }) {
  const { addToCart, pendingProductId } = useAddToCart();

  if (!product) {
    return null;
  }

  const isAdding = pendingProductId === product.id;

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.id}`}
        className="product-card-media"
        aria-label={product.title}
      >
        <img src={product.image} alt={product.title} loading="lazy" />

        <span className="product-card-badge">
          {formatCategory(product.category)}
        </span>
      </Link>

      <div className="product-card-body">
        <h3 className="product-card-title" title={product.title}>
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>

        <Rating rate={product.rating.rate} count={product.rating.count} />

        <p className="product-card-price">{formatPrice(product.price)}</p>

        <div className="product-card-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => addToCart(product, 1)}
            disabled={isAdding}
          >
            {isAdding ? "Adding…" : "Add to Cart"}
          </button>

          <Link
            to={`/products/${product.id}`}
            className="btn btn-ghost btn-block"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
