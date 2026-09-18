import { Link } from "react-router-dom";

/**
 * One place for the loading / empty / error screens, so every page in Shopora
 * communicates the same way instead of showing a blank area.
 */

export function StateMessage({
  icon = "•",
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  tone = "neutral",
}) {
  return (
    <div className={`state-message state-${tone}`}>
      <div className="state-icon" aria-hidden="true">
        {icon}
      </div>

      <h3 className="state-title">{title}</h3>

      {description && <p className="state-description">{description}</p>}

      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary state-action">
          {actionLabel}
        </Link>
      )}

      {actionLabel && !actionTo && onAction && (
        <button
          type="button"
          className="btn btn-primary state-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <StateMessage
      icon="!"
      tone="error"
      title="Something went wrong"
      description={message || "Unable to load products. Please try again."}
      actionLabel={onRetry ? "Try Again" : undefined}
      onAction={onRetry}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-image" />

      <div className="product-card-body">
        <div className="skeleton skeleton-line skeleton-line-sm" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line-md" />
        <div className="skeleton skeleton-line skeleton-line-sm" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function LineSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-block" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton skeleton-line" />
      ))}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}

export default StateMessage;
