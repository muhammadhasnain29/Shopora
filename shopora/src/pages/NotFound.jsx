import { StateMessage } from "../components/States";

function NotFound() {
  return (
    <section className="section">
      <div className="section-inner">
        <StateMessage
          icon="?"
          title="Page not found"
          description="The page you were looking for doesn't exist or has moved."
          actionLabel="Back to Home"
          actionTo="/"
        />
      </div>
    </section>
  );
}

export default NotFound;
