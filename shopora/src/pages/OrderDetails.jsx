import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import OrderDetailView from "../components/OrderDetailView";
import { ErrorState, Spinner } from "../components/States";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

/** Full details of one order, reachable from My Orders. */
function OrderDetails() {
  const { orderId } = useParams();
  const { userId } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await api.getOrder(orderId, userId);

        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.status === 403
              ? "This order belongs to a different account."
              : err.message || "Unable to load this order."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [orderId, userId]);

  return (
    <section className="section">
      <div className="section-inner">
        <nav className="breadcrumb no-print" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/orders">My Orders</Link>
          <span aria-hidden="true">/</span>
          <span>Order details</span>
        </nav>

        {loading && (
          <div className="page-centered">
            <Spinner label="Loading order…" />
          </div>
        )}

        {!loading && error && <ErrorState message={error} />}

        {!loading && !error && order && (
          <>
            <OrderDetailView order={order} />

            <div className="center-row no-print">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => window.print()}
              >
                Print Receipt
              </button>

              <Link to="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default OrderDetails;
