import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton, ErrorState, StateMessage } from "../components/States";
import { useCatalog } from "../context/CatalogContext";
import { formatCategory } from "../config/store";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name A–Z" },
];

const PAGE_SIZE = 8;

/**
 * The shop page. Category and search live in the URL (?category=, ?search=) so
 * a filtered view can be linked to and survives a refresh.
 */
function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, loading, error, reload } = useCatalog();

  const [sort, setSort] = useState("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const activeCategory = searchParams.get("category") || "";
  const searchTerm = searchParams.get("search") || "";

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory) {
      result = result.filter((product) => product.category === activeCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();

      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
      );
    }

    const sorted = [...result];

    if (sort === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sort === "rating") {
      sorted.sort((a, b) => b.rating.rate - a.rating.rate);
    } else if (sort === "name") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [products, activeCategory, searchTerm, sort]);

  const selectCategory = (category) => {
    const next = new URLSearchParams(searchParams);

    if (category) {
      next.set("category", category);
    } else {
      next.delete("category");
    }

    setVisible(PAGE_SIZE);
    setSearchParams(next);
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    setSearchParams(next);
  };

  const heading = activeCategory
    ? formatCategory(activeCategory)
    : searchTerm
    ? `Results for “${searchTerm}”`
    : "All Products";

  return (
    <section className="section">
      <div className="section-inner">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products">Products</Link>

          {activeCategory && (
            <>
              <span aria-hidden="true">/</span>
              <span>{formatCategory(activeCategory)}</span>
            </>
          )}
        </nav>

        <div className="section-head">
          <div>
            <p className="eyebrow">Shop all</p>
            <h2>{heading}</h2>

            {!loading && !error && (
              <p className="muted">
                {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </p>
            )}
          </div>

          <div className="toolbar">
            <label className="select-field">
              <span className="sr-only">Sort products</span>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="filter-bar">
          <button
            type="button"
            className={`chip${!activeCategory ? " chip-active" : ""}`}
            onClick={() => selectCategory("")}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`chip${activeCategory === category ? " chip-active" : ""}`}
              onClick={() => selectCategory(category)}
            >
              {formatCategory(category)}
            </button>
          ))}

          {searchTerm && (
            <button type="button" className="chip chip-clear" onClick={clearSearch}>
              Clear search “{searchTerm}” ×
            </button>
          )}
        </div>

        {loading && <ProductGridSkeleton count={8} />}

        {!loading && error && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && filtered.length === 0 && (
          <StateMessage
            icon="⌕"
            title="No products found"
            description="Try a different category or search term."
            actionLabel="View all products"
            actionTo="/products"
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="products-grid">
              {filtered.slice(0, visible).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visible < filtered.length && (
              <div className="center-row">
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => setVisible((current) => current + PAGE_SIZE)}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Products;
