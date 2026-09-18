import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatDate } from "../config/store";

/** The signed in customer's account information. */
function Profile() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { count } = useCart();

  // Returning to the public store keeps logout feeling like "become a guest"
  // rather than bouncing through the protected-route redirect.
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = (user?.name || user?.email || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <section className="section">
      <div className="section-inner">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>My Profile</span>
        </nav>

        <div className="profile-header">
          <span className="profile-avatar" aria-hidden="true">
            {initials}
          </span>

          <div>
            <h2>{user?.name || "Your account"}</h2>
            <p className="muted">{user?.email}</p>
          </div>
        </div>

        <div className="profile-grid">
          <section className="panel">
            <h3 className="panel-title">Account Information</h3>

            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{user?.name || "Not provided"}</dd>
              </div>

              <div>
                <dt>Email</dt>
                <dd>{user?.email || "—"}</dd>
              </div>

              <div>
                <dt>Phone</dt>
                <dd>{user?.phone || "Not provided"}</dd>
              </div>

              <div>
                <dt>Customer ID</dt>
                <dd>#{user?.userId}</dd>
              </div>

              {user?.createdAt && (
                <div>
                  <dt>Member since</dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
              )}
            </dl>

            <p className="fine-print">
              Shipping addresses are captured per order at checkout, so they are
              not stored on the profile yet.
            </p>
          </section>

          <div className="profile-side">
            <section className="panel">
              <h3 className="panel-title">Quick Links</h3>

              <div className="stack">
                <Link to="/orders" className="btn btn-outline btn-block">
                  My Orders
                </Link>

                <Link to="/cart" className="btn btn-outline btn-block">
                  My Cart{count > 0 ? ` (${count})` : ""}
                </Link>

                <Link to="/products" className="btn btn-primary btn-block">
                  Continue Shopping
                </Link>
              </div>
            </section>

            <section className="panel">
              <h3 className="panel-title">Session</h3>

              <p className="muted">
                Logging out clears your session on this device and returns you to
                the public store as a guest.
              </p>

              <button
                type="button"
                className="btn btn-danger btn-block"
                onClick={handleLogout}
              >
                Logout
              </button>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
