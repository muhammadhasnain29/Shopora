import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { Spinner } from "./States";

/**
 * Wraps pages that only make sense for a signed in customer (profile, orders,
 * checkout). Guests are sent to the login page and returned to the page they
 * asked for once they are signed in.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  // Wait for the remembered session to be validated before deciding, otherwise
  // a returning customer would be bounced to the login page on every reload.
  if (initializing) {
    return (
      <div className="page page-centered">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}

/** Scrolls to the top whenever the route changes. */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

export default RequireAuth;
