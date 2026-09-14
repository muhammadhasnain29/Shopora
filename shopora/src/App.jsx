import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

import "./App.css";

import ProductCard from "./components/ProductCard";
import Login from "./components/Login";
import Register from "./components/Register";

import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";

const API_URL = "http://localhost:5256/api";


// ============================================================
// HOME
// ============================================================

function Home({ products, loading }) {
  return (
    <>
      <main className="hero">
        <div className="hero-content">
          <p className="small-title">WELCOME TO SHOPORA</p>

          <h1>
            Discover Products
            <br />
            You'll Love.
          </h1>

          <p className="hero-text">
            Explore our collection of quality products at amazing prices.
          </p>

          <Link to="/products">
            <button>Explore Products</button>
          </Link>
        </div>
      </main>

      <section className="products-section">
        <div className="section-heading">
          <p>OUR COLLECTION</p>
          <h2>Featured Products</h2>
        </div>

        {loading ? (
          <p className="loading">Loading products...</p>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}


// ============================================================
// PRODUCTS
// ============================================================

function Products({ products, loading }) {
  const [visibleProducts, setVisibleProducts] = useState(4);

  const handleSeeMore = () => {
    setVisibleProducts((prev) => prev + 4);
  };

  return (
    <section className="products-section">
      <div className="section-heading">
        <p>SHOP ALL</p>
        <h2>All Products</h2>
      </div>

      {loading ? (
        <p className="loading">Loading products...</p>
      ) : (
        <>
          <div className="products-grid">
            {products
              .slice(0, visibleProducts)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
          </div>

          {visibleProducts < products.length && (
            <div className="see-more-container">
              <button
                className="see-more-btn"
                onClick={handleSeeMore}
              >
                See More <span>→</span>
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}


// ============================================================
// PRODUCT DETAILS
// ============================================================

function ProductDetails({
  products,
  loading,
  refreshCartCount,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  const product = products.find(
    (product) => product.id === Number(id)
  );

  const loggedInUser = JSON.parse(
    localStorage.getItem("shoporaUser")
  );

  const cartId = loggedInUser?.cartId;

  if (loading) {
    return (
      <p className="loading">
        Loading product...
      </p>
    );
  }

  if (!product) {
    return (
      <p className="loading">
        Product not found.
      </p>
    );
  }

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) =>
      prev > 1 ? prev - 1 : 1
    );
  };

  const addToCart = async () => {
    if (!loggedInUser) {
      navigate("/login");
      return;
    }

    if (!cartId) {
      setMessage(
        "Cart not found for this user."
      );
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/cart/${cartId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: quantity,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Server error:",
          errorText
        );

        throw new Error(
          "Failed to add product to cart"
        );
      }

      const data =
        await response.json();

      console.log(
        "Added to cart:",
        data
      );

      setMessage(
        "Product added to cart successfully!"
      );

      await refreshCartCount();

      setTimeout(() => {
        navigate("/cart");
      }, 700);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setMessage(
        "Failed to add product to cart."
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <section className="product-details">
      <div className="details-image">
        <img
          src={product.image}
          alt={product.title}
        />
      </div>

      <div className="details-content">
        <p className="product-category">
          {product.category}
        </p>

        <h1>{product.title}</h1>

        <p className="details-price">
          ${product.price}
        </p>

        <p className="details-description">
          {product.description}
        </p>

        <p className="details-rating">
          ⭐ {product.rating.rate} (
          {product.rating.count} reviews)
        </p>

        <div style={{ marginBottom: "20px" }}>
          <strong>Quantity:</strong>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginTop: "10px",
            }}
          >
            <button
              onClick={decreaseQuantity}
              disabled={quantity === 1}
            >
              −
            </button>

            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {quantity}
            </span>

            <button
              onClick={increaseQuantity}
            >
              +
            </button>
          </div>
        </div>

        <p>
          <strong>
            Total: $
            {(
              product.price * quantity
            ).toFixed(2)}
          </strong>
        </p>

        <button
          className="add-cart"
          onClick={addToCart}
          disabled={adding}
        >
          {adding
            ? "Adding..."
            : "Add to Cart"}
        </button>

        {message && (
          <p style={{ marginTop: "15px" }}>
            {message}
          </p>
        )}

        <br />
        <br />

        <Link
          to="/products"
          className="back-products"
        >
          ← Back to Products
        </Link>
      </div>
    </section>
  );
}


// ============================================================
// CART
// ============================================================

function Cart({ refreshCartCount }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const loggedInUser = JSON.parse(
    localStorage.getItem("shoporaUser")
  );

  const cartId = loggedInUser?.cartId;

  const fetchCart = async () => {
    if (!cartId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/cart/${cartId}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load cart"
        );
      }

      const data =
        await response.json();

      setCart(data);
    } catch (error) {
      console.error(
        "Cart error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const increaseQuantity = async (
    item
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/cart/items/${item.cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            item.quantity + 1
          ),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to increase quantity"
        );
      }

      await fetchCart();
      await refreshCartCount();
    } catch (error) {
      console.error(error);
    }
  };

  const decreaseQuantity = async (
    item
  ) => {
    if (item.quantity <= 1) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/cart/items/${item.cartItemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            item.quantity - 1
          ),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to decrease quantity"
        );
      }

      await fetchCart();
      await refreshCartCount();
    } catch (error) {
      console.error(error);
    }
  };

  const removeItem = async (
    cartItemId
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/cart/items/${cartItemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to remove item"
        );
      }

      await fetchCart();
      await refreshCartCount();
    } catch (error) {
      console.error(error);
    }
  };

  if (!loggedInUser) {
    return (
      <section className="products-section">
        <h1>Please login first.</h1>

        <br />

        <Link to="/login">
          <button>Login</button>
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="products-section">
        <h1>Loading cart...</h1>
      </section>
    );
  }

  if (!cart) {
    return (
      <section className="products-section">
        <h1>
          Unable to load cart.
        </h1>
      </section>
    );
  }

  const total =
    cart.cartItems.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0
    );

  const totalItems =
    cart.cartItems.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  return (
    <section className="products-section">
      <div className="section-heading">
        <p>YOUR SHOPPING CART</p>
        <h2>My Cart</h2>
      </div>

      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <p>
          <strong>Name:</strong>{" "}
          {cart.userName}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {cart.userNumber}
        </p>

        <p>
          <strong>Total Items:</strong>{" "}
          {totalItems}
        </p>
      </div>

      {cart.cartItems.length === 0 ? (
        <div>
          <h2>
            Your cart is empty.
          </h2>

          <br />

          <Link to="/products">
            <button>
              Continue Shopping
            </button>
          </Link>
        </div>
      ) : (
        <>
          {cart.cartItems.map(
            (item) => (
              <div
                key={
                  item.cartItemId
                }
                style={{
                  border:
                    "1px solid #ddd",
                  padding: "20px",
                  marginBottom:
                    "20px",
                  borderRadius:
                    "10px",
                }}
              >
                <h3>
                  {item.productName}
                </h3>

                <p>
                  Price: $
                  {item.price.toFixed(
                    2
                  )}
                </p>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "15px",
                    margin:
                      "15px 0",
                  }}
                >
                  <strong>
                    Quantity:
                  </strong>

                  <button
                    onClick={() =>
                      decreaseQuantity(
                        item
                      )
                    }
                    disabled={
                      item.quantity ===
                      1
                    }
                  >
                    −
                  </button>

                  <span>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      increaseQuantity(
                        item
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <p>
                  <strong>
                    Subtotal: $
                    {(
                      item.price *
                      item.quantity
                    ).toFixed(2)}
                  </strong>
                </p>

                <button
                  onClick={() =>
                    removeItem(
                      item.cartItemId
                    )
                  }
                >
                  Remove
                </button>
              </div>
            )
          )}

          <hr />

          <h2>
            Grand Total: $
            {total.toFixed(2)}
          </h2>

          <div className="cart-actions">
            <Link
              to="/products"
              className="continue-shopping-link"
            >
              ← Continue Shopping
            </Link>

            <Link to="/checkout">
              <button className="checkout-btn">
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}


// ============================================================
// PROTECTED ROUTE
// ============================================================
// Guards any page that requires an authenticated user (Home, Products,
// Product Details, Cart, Checkout, Payment, Orders, etc). If there's no
// logged-in user, redirect to /login and remember where the user was
// trying to go so Login can send them back after a successful login.

function ProtectedRoute({ loggedInUser, children }) {
  const location = useLocation();

  if (!loggedInUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}


// ============================================================
// HEADER / NAVBAR
// ============================================================
// Rendered inside <BrowserRouter> so it can use useNavigate for logout.

function Header({ loggedInUser, cartCount, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="logo">
        SHOPORA
      </div>

      <div className="nav-links">
        <Link to="/">
          Home
        </Link>

        <Link to="/products">
          Products
        </Link>

        <Link to="/categories">
          Categories
        </Link>

        {loggedInUser && (
          <>
            <span className="nav-user">
              Hi, {loggedInUser.name || loggedInUser.email}
            </span>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </>
        )}
      </div>

      <Link
        to="/cart"
        className="cart"
        style={{
          textDecoration: "none",
        }}
      >
        🛒{" "}
        <span>
          {cartCount}
        </span>
      </Link>
    </nav>
  );
}


// ============================================================
// APP
// ============================================================

function App() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [cartCount, setCartCount] =
    useState(0);

  const hasFetched = useRef(false);


  // ==========================================================
  // AUTHENTICATED USER
  // ==========================================================
  // Restore the logged-in user from localStorage on load (including on a
  // browser refresh) so the user stays logged in until they explicitly
  // click Logout. This is the single source of truth for the header and
  // for protecting routes.

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const stored = localStorage.getItem("shoporaUser");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to parse stored user:", error);
      return null;
    }
  });

  const handleLogout = () => {
    // Only clear the current user's auth/session info — product data,
    // caches, etc. are left untouched.
    localStorage.removeItem("shoporaUser");
    setLoggedInUser(null);
    setCartCount(0);
  };


  // ==========================================================
  // FETCH PRODUCTS
  // ==========================================================

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }

    hasFetched.current = true;

    const cachedProducts =
      sessionStorage.getItem(
        "products"
      );

    if (cachedProducts) {
      setProducts(
        JSON.parse(cachedProducts)
      );

      setLoading(false);

      return;
    }

    fetch(
      "https://fakestoreapi.com/products"
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {
        setProducts(data);

        sessionStorage.setItem(
          "products",
          JSON.stringify(data)
        );

        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error fetching products:",
          error
        );

        setLoading(false);
      });
  }, []);


  // ==========================================================
  // REFRESH CART COUNT
  // ==========================================================

  const refreshCartCount =
    async () => {
      try {
        const loggedInUser =
          JSON.parse(
            localStorage.getItem(
              "shoporaUser"
            )
          );

        const cartId =
          loggedInUser?.cartId;

        if (!cartId) {
          setCartCount(0);
          return;
        }

        const response =
          await fetch(
            `${API_URL}/cart/${cartId}`
          );

        if (!response.ok) {
          setCartCount(0);
          return;
        }

        const data =
          await response.json();

        const count =
          data.cartItems.reduce(
            (sum, item) =>
              sum + item.quantity,
            0
          );

        setCartCount(count);
      } catch (error) {
        console.error(
          "Cart count error:",
          error
        );

        setCartCount(0);
      }
    };


  useEffect(() => {
    refreshCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedInUser]);


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <BrowserRouter>
      <Header
        loggedInUser={loggedInUser}
        cartCount={cartCount}
        onLogout={handleLogout}
      />


      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <Home
                products={products}
                loading={loading}
              />
            </ProtectedRoute>
          }
        />


        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <Products
                products={products}
                loading={loading}
              />
            </ProtectedRoute>
          }
        />


        {/* PRODUCT DETAILS */}
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <ProductDetails
                products={products}
                loading={loading}
                refreshCartCount={
                  refreshCartCount
                }
              />
            </ProtectedRoute>
          }
        />


        {/* CART */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <Cart
                refreshCartCount={
                  refreshCartCount
                }
              />
            </ProtectedRoute>
          }
        />


        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login onAuth={setLoggedInUser} />}
        />


        {/* REGISTER */}
        <Route
          path="/register"
          element={<Register onAuth={setLoggedInUser} />}
        />


        {/* CHECKOUT */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <Checkout
                refreshCartCount={
                  refreshCartCount
                }
              />
            </ProtectedRoute>
          }
        />


        {/* PAYMENT */}
        <Route
          path="/payment/:orderId"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <Payment />
            </ProtectedRoute>
          }
        />


        {/* ORDER CONFIRMATION */}
        <Route
          path="/order-confirmation/:orderId"
          element={
            <ProtectedRoute loggedInUser={loggedInUser}>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;