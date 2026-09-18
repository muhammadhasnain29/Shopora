/**
 * Colours a status string coming from the API. Unknown values still render,
 * just with the neutral style, so a new backend status never breaks the UI.
 */
function toneFor(status) {
  const value = (status || "").toLowerCase();

  if (value.includes("paid")) {
    return "success";
  }

  if (value.includes("confirmed")) {
    return "info";
  }

  if (value.includes("cancel") || value.includes("failed")) {
    return "danger";
  }

  if (value.includes("pending")) {
    return "warning";
  }

  return "neutral";
}

function StatusBadge({ status, label }) {
  if (!status) {
    return null;
  }

  return (
    <span className={`badge badge-${toneFor(status)}`}>
      {label ? `${label}: ` : ""}
      {status}
    </span>
  );
}

export default StatusBadge;
