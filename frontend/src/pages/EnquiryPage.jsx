import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { fetchProducts, submitEnquiry } from "../api";

const initialState = {
  name: "",
  contactNumber: "",
  email: "",
  productInterest: "",
  message: ""
};

function EnquiryPage() {
  const [formData, setFormData] = useState(initialState);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      const result = await submitEnquiry(formData);
      const statusType = result?.emailStatus?.sent === false ? "warning" : "success";
      setStatus({
        type: statusType,
        message: result?.message || "Enquiry submitted successfully."
      });
      setFormData(initialState);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <section className="container page-section">
      <BackButton fallbackTo="/" />
      <header className="page-header">
        <p className="eyebrow">Customer Enquiry</p>
        <h1>Request Product or Service Information</h1>
      </header>

      {status.message && (
        <p className={`status-message ${status.type}`}>{status.message}</p>
      )}

      <form className="enquiry-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Contact Number
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Service Interest
          <select
            name="productInterest"
            value={formData.productInterest}
            onChange={handleChange}
            required
          >
            <option value="">Select a service</option>
            {products.map((product) => (
              <option key={product.id} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="full-width">
          Message
          <textarea
            name="message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Submit Enquiry
        </button>
      </form>
    </section>
  );
}

export default EnquiryPage;
