import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../api";

const CORE_CATEGORIES = [
  "Construction Materials",
  "Structural Works",
  "Fabrication Works",
  "Finishing Works",
  "Building Services",
  "Construction Projects"
];

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCategory = searchParams.get("category") || "All";
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(() => {
    const merged = [...CORE_CATEGORIES, ...products.map((item) => item.category)];
    const categorySet = new Set(merged);
    return ["All", ...categorySet];
  }, [products]);

  useEffect(() => {
    if (queryCategory === "All") {
      setSelectedCategory("All");
      return;
    }

    if (categories.includes(queryCategory)) {
      setSelectedCategory(queryCategory);
      return;
    }

    setSelectedCategory("All");
  }, [categories, queryCategory]);

  function handleCategoryChange(category) {
    setSelectedCategory(category);

    if (category === "All") {
      setSearchParams({});
      return;
    }

    setSearchParams({ category });
  }

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") {
      return products;
    }

    return products.filter((item) => item.category === selectedCategory);
  }, [products, selectedCategory]);

  const selectedCategoryItems = useMemo(
    () => filteredProducts.map((item) => item.name),
    [filteredProducts]
  );

  return (
    <section className="container page-section">
      <BackButton fallbackTo="/" />
      <header className="page-header">
        <p className="eyebrow">Products & Services</p>
        <h1>Construction Products and Services Catalog</h1>
        <p>
          Explore construction materials, structural works, fabrication works,
          finishing solutions, and project services from Standard Engineering
          and Builders. Compare categories and send your enquiry directly from
          each service page.
        </p>
      </header>

      {error && <p className="status-message error">{error}</p>}

      <div className="category-filter">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? "active" : ""}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {selectedCategory !== "All" && (
        <section className="category-items-panel" aria-label="Category items">
          <h2>{selectedCategory}</h2>
          <p>Available items in this category:</p>
          <div className="category-items-list">
            {selectedCategoryItems.map((itemName) => (
              <span key={itemName} className="category-item-pill">
                {itemName}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default ProductsPage;
