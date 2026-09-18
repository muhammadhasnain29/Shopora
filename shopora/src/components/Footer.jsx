import { Link } from "react-router-dom";

import { useCatalog } from "../context/CatalogContext";
import { STORE, formatCategory } from "../config/store";

function Footer() {
  const { categories } = useCatalog();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="brand brand-footer">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <span className="brand-name">{STORE.name}</span>
          </Link>

          <p className="footer-tagline">{STORE.tagline}</p>
        </div>

        <div className="footer-column">
          <h4>Shop</h4>

          <Link to="/products">All Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/cart">Your Cart</Link>
        </div>

        <div className="footer-column">
          <h4>Categories</h4>

          {categories.slice(0, 5).map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
            >
              {formatCategory(category)}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h4>Account</h4>

          <Link to="/profile">My Profile</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/login">Sign In</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {STORE.name}. Sold by {STORE.soldBy}.
        </p>

        <p className="footer-note">
          Demo storefront — orders are stored in the Shopora database, no real
          payment is taken.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
