import { Link } from "react-router-dom";

import { ErrorState, StateMessage, LineSkeleton } from "../components/States";
import { useCatalog } from "../context/CatalogContext";
import { formatCategory } from "../config/store";

/**
 * Dedicated categories page. Previously the navbar linked to /categories with
 * no matching route, which rendered a blank screen.
 */
function Categories() {
  const { products, categories, loading, error, reload } = useCatalog();

  const countFor = (category) =>
    products.filter((product) => product.category === category).length;

  const previewFor = (category) =>
    products.find((product) => product.category === category)?.image;

  return (
    <section className="section">
      <div className="section-inner">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Categories</span>
        </nav>

        <div className="section-head">
          <div>
            <p className="eyebrow">Browse</p>
            <h2>All Categories</h2>
          </div>
        </div>

        {loading && <LineSkeleton rows={4} />}

        {!loading && error && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && categories.length === 0 && (
          <StateMessage
            icon="◇"
            title="No categories yet"
            description="Once products are added to the catalogue their categories appear here."
            actionLabel="View all products"
            actionTo="/products"
          />
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="category-grid">
            {categories.map((category) => {
              const image = previewFor(category);

              return (
                <Link
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="category-card"
                >
                  <div className="category-card-media">
                    {image ? (
                      <img src={image} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">◇</span>
                    )}
                  </div>

                  <div className="category-card-body">
                    <h3>{formatCategory(category)}</h3>

                    <p className="muted">
                      {countFor(category)}{" "}
                      {countFor(category) === 1 ? "product" : "products"}
                    </p>
                  </div>

                  <span className="category-card-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Categories;
