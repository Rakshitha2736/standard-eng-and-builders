import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} className="product-thumb" />
      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.shortDescription}</p>
        <div className="product-meta">
          <span>{product.price}</span>
          <Link to={`/products/${product.id}`} className="btn btn-light">
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
