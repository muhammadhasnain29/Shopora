import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { parseResponse } from "../utils/api";

const API_URL = "http://localhost:5256/api";

function Register({ onAuth }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If the user is already logged in, no need to register again.
  useEffect(() => {
    const existingUser = localStorage.getItem("shoporaUser");

    if (existingUser) {
      navigate(location.state?.from || "/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          typeof data === "string" && data ? data : "Registration failed."
        );
      }

      // Save registered user
      localStorage.setItem("shoporaUser", JSON.stringify(data));

      // Let the app-level state know a user just registered/logged in.
      if (onAuth) {
        onAuth(data);
      }

      // If the user started from checkout, send them back there
      if (location.state?.from) {
        navigate(location.state.from, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="products-section">
      <div className="section-heading">
        <p>JOIN SHOPORA</p>
        <h2>Create Account</h2>
      </div>

      <form
        onSubmit={handleRegister}
        style={{
          maxWidth: "450px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label>Full Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Phone Number</label>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XXXXXXXXX"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p style={{ marginTop: "20px" }}>
          Already have an account?{" "}
          <Link to="/login" state={location.state}>
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}

export default Register;
