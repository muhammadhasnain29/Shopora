import { Link } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton, ErrorState } from "../components/States";
import { useCatalog } from "../context/CatalogContext";
import { STORE, formatCategory } from "../config/store";

const HIGHLIGHTS = [
  {
    icon: "⌁",
    title: "Fast dispatch",
    text: "Orders are prepared the same working day.",
  },
  {
    icon: "✓",
    title: "Quality checked",
    text: "Every item is inspected before it ships.",
  },
  {
    icon: "↺",
    title: "Easy returns",
    text: "Changed your mind? Return within 14 days.",
  },
];

function Home() {
  const { products, categories, loading, error, reload } = useCatalog();

  const featured = products.slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <p className="eyebrow">Welcome to {STORE.name}</p>

            <h1>
              Discover products
              <br />
              you&rsquo;ll actually love.
            </h1>

            <p className="hero-text">{STORE.tagline}</p>

            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop All Products
              </Link>

              <Link to="/categories" className="btn btn-outline btn-lg">
                Browse Categories
              </Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-blob" />

            {featured[0]?.image && (
              <img
                className="hero-product hero-product-1"
                src={featured[0].image}
                alt=""
              />
            )}

            {featured[1]?.image && (
              <img
                className="hero-product hero-product-2"
                src={featured[1].image}
                alt=""
              />
            )}

            {featured[2]?.image && (
              <img
                className="hero-product hero-product-3"
                src={featured[2].image}
                alt=""
              />
            )}
          </div>
        </div>
      </section>

      <section className="highlights">
        <div className="highlights-inner">
          {HIGHLIGHTS.map((item) => (
            <div className="highlight" key={item.title}>
              <span className="highlight-icon" aria-hidden="true">
                {item.icon}
              </span>

              <div>
                <p className="highlight-title">{item.title}</p>
                <p className="highlight-text">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <div className="section-head">
              <div>
                <p className="eyebrow">Shop by category</p>
                <h2>Find your department</h2>
              </div>

              <Link to="/categories" className="link-arrow">
                View all <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="category-strip">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="category-chip"
                >
                  {formatCategory(category)}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-muted">
        <div className="section-inner">
          <div className="section-head">
            <div>
              <p className="eyebrow">Our collection</p>
              <h2>Featured products</h2>
            </div>

            <Link to="/products" className="link-arrow">
              See all products <span aria-hidden="true">→</span>
            </Link>
          </div>

          {loading && <ProductGridSkeleton count={8} />}

          {!loading && error && <ErrorState message={error} onRetry={reload} />}

          {!loading && !error && (
            <div className="products-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
