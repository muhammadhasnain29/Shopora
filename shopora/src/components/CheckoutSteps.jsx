const STEPS = [
  { number: 1, label: "Cart" },
  { number: 2, label: "Shipping" },
  { number: 3, label: "Payment" },
  { number: 4, label: "Confirmation" },
];

/**
 * The Cart → Shipping → Payment → Confirmation progress bar shown on every step
 * of the purchase journey.
 */
function CheckoutSteps({ current = 1 }) {
  return (
    <ol className="checkout-steps" aria-label="Checkout progress">
      {STEPS.map((step) => {
        const isDone = step.number < current;
        const isCurrent = step.number === current;

        return (
          <li
            key={step.number}
            className={`checkout-step${isDone ? " step-done" : ""}${
              isCurrent ? " step-current" : ""
            }`}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span className="step-marker">
              {isDone ? "✓" : step.number}
            </span>

            <span className="step-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default CheckoutSteps;
