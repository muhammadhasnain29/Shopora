import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-image">
        <img src={product.image} alt={product.title} />
      </Link>

      <div className="product-info">
        <p className="product-category">{product.category}</p>

        <h3>{product.title}</h3>

        <div className="product-rating">
          ⭐ {product.rating.rate}
          <span> ({product.rating.count})</span>
        </div>

        <p className="product-price">${product.price}</p>

        <Link
          to={`/products/${product.id}`}
          className="view-product"
        >
          View Product
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;