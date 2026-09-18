import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import useClickOutside from "../hooks/useClickOutside";
import { STORE, formatCategory } from "../config/store";

function initialsOf(name, email) {
  const source = (name || email || "").trim();

  if (!source) {
    return "?";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, logout, requireAuth } = useAuth();
  const { count } = useCart();
  const { categories } = useCatalog();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartBump, setCartBump] = useState(false);

  const categoriesRef = useRef(null);
  const profileRef = useRef(null);

  const closeCategories = useCallback(() => setCategoriesOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);

  useClickOutside(categoriesRef, closeCategories, categoriesOpen);
  useClickOutside(profileRef, closeProfile, profileOpen);

  // Close every menu when the route changes.
  useEffect(() => {
    setCategoriesOpen(false);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Keep the search box in step with the URL when arriving from a search link.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get("search") || "");
  }, [location.search]);

  // Subtle pulse on the cart badge whenever the item count changes.
  const previousCount = useRef(count);

  useEffect(() => {
    if (count !== previousCount.current && count > 0) {
      setCartBump(true);

      const timer = setTimeout(() => setCartBump(false), 400);

      previousCount.current = count;

      return () => clearTimeout(timer);
    }

    previousCount.current = count;

    return undefined;
  }, [count]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleSearch = (event) => {
    event.preventDefault();

    const term = searchTerm.trim();

    navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
  };

  const handleProtectedLink = (path, message) => {
    if (isAuthenticated) {
      navigate(path);
      return;
    }

    requireAuth({
      message,
      action: () => navigate(path),
    });
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  const displayName = user?.name || user?.email || "Account";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          type="button"
          className="icon-btn navbar-burger"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span className={`burger${mobileOpen ? " burger-open" : ""}`} />
        </button>

        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-name">{STORE.name}</span>
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>

          <NavLink to="/products" end className="nav-link">
            Products
          </NavLink>

          <div className="nav-dropdown" ref={categoriesRef}>
            <button
              type="button"
              className={`nav-link nav-dropdown-trigger${
                categoriesOpen ? " is-open" : ""
              }`}
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-expanded={categoriesOpen}
              aria-haspopup="true"
            >
              Categories
              <span className="chevron" aria-hidden="true" />
            </button>

            {categoriesOpen && (
              <div className="dropdown dropdown-categories" role="menu">
                {categories.length === 0 ? (
                  <p className="dropdown-empty">Categories unavailable.</p>
                ) : (
                  <>
                    {categories.map((category) => (
                      <Link
                        key={category}
                        to={`/products?category=${encodeURIComponent(category)}`}
                        className="dropdown-item"
                        role="menuitem"
                      >
                        {formatCategory(category)}
                      </Link>
                    ))}

                    <div className="dropdown-divider" />

                    <Link
                      to="/categories"
                      className="dropdown-item dropdown-item-muted"
                      role="menuitem"
                    >
                      Browse all categories
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
          />
        </form>

        <div className="navbar-actions">
          <Link to="/cart" className="cart-btn" aria-label="View cart">
            <span className="cart-icon" aria-hidden="true">
              🛒
            </span>

            <span className="cart-label">Cart</span>

            {count > 0 && (
              <span className={`cart-badge${cartBump ? " cart-badge-bump" : ""}`}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <div className="nav-dropdown" ref={profileRef}>
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              {isAuthenticated ? (
                <span className="avatar">{initialsOf(user?.name, user?.email)}</span>
              ) : (
                <span className="avatar avatar-guest" aria-hidden="true">
                  ◯
                </span>
              )}
            </button>

            {profileOpen && (
              <div className="dropdown dropdown-profile" role="menu">
                {isAuthenticated ? (
                  <>
                    <div className="dropdown-header">
                      <p className="dropdown-name">{displayName}</p>
                      {user?.email && (
                        <p className="dropdown-email">{user.email}</p>
                      )}
                    </div>

                    <div className="dropdown-divider" />

                    <Link to="/profile" className="dropdown-item" role="menuitem">
                      View Profile
                    </Link>

                    <Link to="/orders" className="dropdown-item" role="menuitem">
                      My Orders
                    </Link>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item dropdown-item-danger"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="dropdown-header">
                      <p className="dropdown-name">Welcome to {STORE.name}</p>
                      <p className="dropdown-email">
                        Sign in to shop, track orders and save your cart.
                      </p>
                    </div>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() =>
                        handleProtectedLink("/profile", "Sign in to view your profile.")
                      }
                      role="menuitem"
                    >
                      Login
                    </button>

                    <Link to="/register" className="dropdown-item" role="menuitem">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`mobile-drawer${mobileOpen ? " mobile-drawer-open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <form className="mobile-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
          />

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <NavLink to="/" end className="mobile-link">
          Home
        </NavLink>

        <NavLink to="/products" end className="mobile-link">
          Products
        </NavLink>

        <NavLink to="/categories" className="mobile-link">
          Categories
        </NavLink>

        <div className="mobile-categories">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="mobile-sublink"
            >
              {formatCategory(category)}
            </Link>
          ))}
        </div>

        <div className="mobile-divider" />

        {isAuthenticated ? (
          <>
            <Link to="/profile" className="mobile-link">
              View Profile
            </Link>

            <Link to="/orders" className="mobile-link">
              My Orders
            </Link>

            <button
              type="button"
              className="mobile-link mobile-link-danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mobile-link">
              Login
            </Link>

            <Link to="/register" className="mobile-link">
              Create Account
            </Link>
          </>
        )}
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="drawer-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}
    </header>
  );
}

export default Navbar;
