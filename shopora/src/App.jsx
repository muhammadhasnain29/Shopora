import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthPrompt from "./components/AuthPrompt";
import { RequireAuth, ScrollToTop } from "./components/RouteHelpers";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { CatalogProvider } from "./context/CatalogContext";
import { ToastProvider } from "./context/ToastContext";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

/**
 * Shopora.
 *
 * The whole storefront is public: guests can browse the home page, the
 * catalogue, categories and product details without ever being asked to sign
 * in. Only the pages wrapped in <RequireAuth> need an account, and any action
 * that needs one (add to cart, buy now) opens the sign-in dialog and then
 * carries on with what the visitor was doing.
 */
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <ScrollToTop />

              <div className="app-shell">
                <Navbar />

                <main className="app-main">
                  <Routes>
                    {/* ---- Public ---- */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* The cart page handles the guest case itself so it can
                        invite the visitor to sign in without a redirect. */}
                    <Route path="/cart" element={<Cart />} />

                    {/* ---- Account only ---- */}
                    <Route
                      path="/checkout"
                      element={
                        <RequireAuth>
                          <Checkout />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/payment/:orderId"
                      element={
                        <RequireAuth>
                          <Payment />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/order-confirmation/:orderId"
                      element={
                        <RequireAuth>
                          <OrderConfirmation />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/orders"
                      element={
                        <RequireAuth>
                          <Orders />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/orders/:orderId"
                      element={
                        <RequireAuth>
                          <OrderDetails />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <RequireAuth>
                          <Profile />
                        </RequireAuth>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>

                <Footer />
              </div>

              <AuthPrompt />
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
