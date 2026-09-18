/**
 * Renders a 0–5 star rating. Values come straight from the catalogue, so a
 * product with no rating simply shows an empty row of stars.
 */
function Rating({ rate = 0, count, size = "sm", showCount = true }) {
  const value = Math.max(0, Math.min(5, Number(rate) || 0));
  const percentage = (value / 5) * 100;

  return (
    <span className={`rating rating-${size}`}>
      <span
        className="rating-stars"
        role="img"
        aria-label={`Rated ${value.toFixed(1)} out of 5`}
      >
        <span className="rating-stars-empty" aria-hidden="true">
          ★★★★★
        </span>

        <span
          className="rating-stars-filled"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
      </span>

      <span className="rating-value">{value.toFixed(1)}</span>

      {showCount && Number(count) > 0 && (
        <span className="rating-count">
          ({Number(count).toLocaleString()})
        </span>
      )}
    </span>
  );
}

export default Rating;
