import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { STORE } from "../config/store";

/** Standalone create-account page. */
function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      const user = await register({ name, phone, email, password });

      showToast(`Welcome to ${STORE.name}, ${user.name || user.email}.`);

      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="auth-page">
        <div className="panel auth-card">
          <div className="auth-head">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>

            <h2>Create your account</h2>

            <p className="muted">
              Join {STORE.name} to save your cart and track your orders.
            </p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                required
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="register-phone">Phone number</label>
              <input
                id="register-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="03XXXXXXXXX"
                required
                autoComplete="tel"
              />
            </div>

            <div className="field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={submitting}
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" state={location.state}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Register;
