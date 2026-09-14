import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { parseResponse } from "../utils/api";

const API_URL = "http://localhost:5256/api";

function Login({ onAuth }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If the user is already logged in (e.g. they typed /login in manually),
  // don't make them log in again — send them on to where they were headed.
  useEffect(() => {
    const existingUser = localStorage.getItem("shoporaUser");

    if (existingUser) {
      navigate(location.state?.from || "/", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await parseResponse(response);

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          typeof data === "string" && data
            ? data
            : "Invalid email or password."
        );
      }

      localStorage.setItem("shoporaUser", JSON.stringify(data));

      // Let the app-level state know a user just logged in, so the header
      // and cart badge update immediately without needing a refresh.
      if (onAuth) {
        onAuth(data);
      }

      // If the user started from checkout (or another protected page),
      // send them back there instead of the homepage.
      if (location.state?.from) {
        navigate(location.state.from, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="products-section">
      <div className="section-heading">
        <p>WELCOME BACK</p>
        <h2>Login</h2>
      </div>

      <form
        onSubmit={handleLogin}
        style={{
          maxWidth: "450px",
          margin: "0 auto",
        }}
      >
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
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
            }}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={{ marginTop: "20px" }}>
          Don't have an account?{" "}
          <Link to="/register" state={location.state}>
            Register
          </Link>
        </p>
      </form>
    </section>
  );
}

export default Login;
