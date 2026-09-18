/** Plain -/+ quantity control used on the product page and in the cart. */
function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));

  return (
    <div className={`qty-stepper qty-${size}`}>
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span className="qty-value" aria-live="polite">
        {value}
      </span>

      <button
        type="button"
        onClick={increase}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export default QuantityStepper;
