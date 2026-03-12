import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import { fetchProduct } from "../api";

function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <section className="container page-section">
        <BackButton fallbackTo="/products" />
        <p className="status-message error">{error}</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="container page-section">
        <BackButton fallbackTo="/products" />
        <p className="status-message">Loading product...</p>
      </section>
    );
  }

  return (
    <section className="container page-section">
      <BackButton fallbackTo="/products" />
      <div className="details-layout">
        <img src={product.image} alt={product.name} className="details-image" />

        <article className="details-panel">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>

          <dl className="spec-grid">
            <div>
              <dt>Material</dt>
              <dd>{product.specs.material}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{product.specs.operation}</dd>
            </div>
            <div>
              <dt>Application</dt>
              <dd>{product.specs.width}</dd>
            </div>
            <div>
              <dt>Quality Focus</dt>
              <dd>{product.specs.finish}</dd>
            </div>
          </dl>

          <div className="details-actions">
            <strong>{product.price}</strong>
            <Link to="/enquiry" className="btn btn-primary">
              Enquire Now
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ProductDetailsPage;
