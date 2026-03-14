import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import {
  createProduct,
  deleteProduct,
  fetchEnquiries,
  fetchProducts,
  loginAdmin,
  respondToEnquiry,
  updateProduct
} from "../api";

const ADMIN_TOKEN_KEY = "standard_admin_token_v2";
const LEGACY_ADMIN_TOKEN_KEY = "standard_admin_token";

function readStoredAdminToken() {
  // One-time cleanup for legacy token key from older deployments.
  if (localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY) && !localStorage.getItem(ADMIN_TOKEN_KEY)) {
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  }

  const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);

  if (!storedToken) {
    return "";
  }

  try {
    const payload = JSON.parse(atob(storedToken.split(".")[1] || ""));

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      return "";
    }

    return storedToken;
  } catch {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    return "";
  }
}

function buildStatusMessage(text = "", tone = "") {
  return { text, tone };
}

function getEnquiryStatusMeta(enquiry) {
  const responseEmailStatus =
    enquiry.responseEmailStatus ||
    (enquiry.status === "responded" ? "sent" : "not_attempted");

  if (responseEmailStatus === "failed") {
    return { label: "Email failed", className: "response-failed" };
  }

  if (responseEmailStatus === "sent" || enquiry.status === "responded") {
    return { label: "Responded", className: "responded" };
  }

  return { label: "New", className: "new" };
}

function getResponseText(enquiry, responseDrafts) {
  const draft = responseDrafts[String(enquiry.id)] || "";

  if (draft.trim()) {
    return draft.trim();
  }

  if (enquiry.responseEmailStatus === "failed") {
    return (enquiry.adminResponse || "").trim();
  }

  return "";
}

function createEmptyProductForm() {
  return {
    name: "",
    category: "",
    description: "",
    price: "",
    shortDescription: "",
    image: "",
    specs: {
      material: "",
      operation: "",
      width: "",
      finish: ""
    }
  };
}

function mapProductToForm(product) {
  return {
    name: product.name || "",
    category: product.category || "",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    image: product.image || "",
    price: product.price || "",
    specs: {
      material: product.specs?.material || "",
      operation: product.specs?.operation || "",
      width: product.specs?.width || "",
      finish: product.specs?.finish || ""
    }
  };
}

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("responses");
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [responseDrafts, setResponseDrafts] = useState({});
  const [statusMessage, setStatusMessage] = useState(buildStatusMessage());
  const [token, setToken] = useState(() => readStoredAdminToken());
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [productForm, setProductForm] = useState(createEmptyProductForm());
  const [editingProductId, setEditingProductId] = useState("");

  function loadEnquiries(activeToken = token) {
    if (!activeToken) {
      return;
    }

    fetchEnquiries(activeToken)
      .then(setEnquiries)
      .catch((error) => {
        if (error.message.includes("token")) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken("");
          setEnquiries([]);
          setStatusMessage(buildStatusMessage());
          return;
        }
        setStatusMessage(buildStatusMessage(error.message, "error"));
      });
  }

  function loadProducts() {
    fetchProducts()
      .then(setProducts)
      .catch((error) => {
        setStatusMessage(buildStatusMessage(error.message, "error"));
      });
  }

  useEffect(() => {
    if (token) {
      loadEnquiries(token);
      loadProducts();
    }
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setStatusMessage(buildStatusMessage());

    try {
      const payload = await loginAdmin(credentials);
      setActiveTab("responses");
      localStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
      setToken(payload.token);
      setCredentials({ username: "", password: "" });
      setStatusMessage(buildStatusMessage("Admin login successful.", "success"));
    } catch (error) {
      setStatusMessage(buildStatusMessage(error.message, "error"));
    }
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
    setToken("");
    setEnquiries([]);
    setProducts([]);
    setEditingProductId("");
    setProductForm(createEmptyProductForm());
    setStatusMessage(buildStatusMessage("Logged out.", "success"));
  }

  async function handleRespond(id) {
    const draftKey = String(id);
    const enquiry = enquiries.find((item) => String(item.id) === draftKey);
    const text = enquiry ? getResponseText(enquiry, responseDrafts) : "";

    if (!text) {
      setStatusMessage(buildStatusMessage("Please enter a response message.", "warning"));
      return;
    }

    try {
      const payload = await respondToEnquiry(id, text, token);
      setStatusMessage(
        buildStatusMessage(
          payload.message || "Response saved.",
          payload.emailStatus?.sent ? "success" : "warning"
        )
      );
      setResponseDrafts((prev) => ({ ...prev, [draftKey]: "" }));
      loadEnquiries(token);
    } catch (error) {
      setStatusMessage(buildStatusMessage(error.message, "error"));
    }
  }

  function handleProductFieldChange(field, value) {
    setProductForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function handleProductSpecFieldChange(field, value) {
    setProductForm((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [field]: value
      }
    }));
  }

  async function handleProductSubmit(event) {
    event.preventDefault();

    if (!productForm.name.trim() || !productForm.category.trim()) {
      setStatusMessage(buildStatusMessage("Product name and category are required.", "warning"));
      return;
    }

    const normalizedDescription = productForm.description.trim();
    const normalizedShortDescription =
      productForm.shortDescription.trim() ||
      (normalizedDescription ? `${normalizedDescription.slice(0, 130)}...` : "");
    const payload = {
      ...productForm,
      shortDescription: normalizedShortDescription,
      image: productForm.image.trim() || "https://placehold.co/1200x800?text=Product"
    };

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload, token);
        setStatusMessage(buildStatusMessage("Product updated successfully.", "success"));
      } else {
        await createProduct(payload, token);
        setStatusMessage(buildStatusMessage("Product added successfully.", "success"));
      }

      setEditingProductId("");
      setProductForm(createEmptyProductForm());
      loadProducts();
    } catch (error) {
      setStatusMessage(buildStatusMessage(error.message, "error"));
    }
  }

  function handleEditProduct(product) {
    setActiveTab("products");
    setEditingProductId(product.id);
    setProductForm(mapProductToForm(product));
    setStatusMessage(buildStatusMessage(`Editing ${product.name}`, "warning"));
  }

  function handleCancelEdit() {
    setEditingProductId("");
    setProductForm(createEmptyProductForm());
    setStatusMessage(buildStatusMessage("Edit canceled.", "success"));
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(`Delete product \"${product.name}\"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(product.id, token);
      if (editingProductId === product.id) {
        setEditingProductId("");
        setProductForm(createEmptyProductForm());
      }
      setStatusMessage(buildStatusMessage("Product deleted successfully.", "success"));
      loadProducts();
    } catch (error) {
      setStatusMessage(buildStatusMessage(error.message, "error"));
    }
  }

  if (!token) {
    return (
      <section className="container page-section">
        <BackButton fallbackTo="/" />
        <header className="page-header">
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Admin Login</h1>
        </header>

        {statusMessage.text && (
          <p className={`status-message ${statusMessage.tone}`.trim()}>{statusMessage.text}</p>
        )}

        <form className="admin-login-form" onSubmit={handleLogin}>
          <label>
            Username
            <input
              type="text"
              value={credentials.username}
              onChange={(event) =>
                setCredentials((prev) => ({ ...prev, username: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="container page-section">
      <BackButton fallbackTo="/" />
      <header className="page-header">
        <p className="eyebrow">Admin Dashboard</p>
        <h1>Admin Panel</h1>
        <button type="button" className="btn btn-light admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {statusMessage.text && (
        <p className={`status-message ${statusMessage.tone}`.trim()}>{statusMessage.text}</p>
      )}

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "responses"}
          className={activeTab === "responses" ? "active" : ""}
          onClick={() => setActiveTab("responses")}
        >
          Responses
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "products"}
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
      </div>

      {activeTab === "responses" && (
        <div className="admin-list">
          {enquiries.length === 0 && (
            <p className="status-message">No enquiries submitted yet.</p>
          )}

          {enquiries.map((enquiry) => {
            const statusMeta = getEnquiryStatusMeta(enquiry);
            const responseText = getResponseText(enquiry, responseDrafts);

            return (
              <article key={enquiry.id} className="admin-card">
                <div className="admin-card-top">
                  <h3>{enquiry.name}</h3>
                  <span className={`pill ${statusMeta.className}`}>{statusMeta.label}</span>
                </div>
                <p>
                  <strong>Product:</strong> {enquiry.productInterest}
                </p>
                <p>
                  <strong>Contact:</strong> {enquiry.contactNumber} | {enquiry.email}
                </p>
                <p>
                  <strong>Message:</strong> {enquiry.message}
                </p>
                {enquiry.adminResponse && (
                  <p>
                    <strong>Previous Response:</strong> {enquiry.adminResponse}
                  </p>
                )}
                {enquiry.responseEmailError && (
                  <p className="status-message warning">
                    Customer email failed: {enquiry.responseEmailError}
                  </p>
                )}

                <textarea
                  rows="3"
                  placeholder="Write response to customer"
                  value={responseDrafts[String(enquiry.id)] || ""}
                  onChange={(event) =>
                    setResponseDrafts((prev) => ({
                      ...prev,
                      [String(enquiry.id)]: event.target.value
                    }))
                  }
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleRespond(enquiry.id)}
                  disabled={!responseText}
                >
                  {enquiry.responseEmailStatus === "failed" ? "Retry Email" : "Send Response"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-products-layout">
          <form className="admin-product-form" onSubmit={handleProductSubmit}>
            <h2>{editingProductId ? "Edit Product" : "Add Product"}</h2>

            <label>
              Name
              <input
                type="text"
                value={productForm.name}
                onChange={(event) => handleProductFieldChange("name", event.target.value)}
                required
              />
            </label>

            <label>
              Category
              <input
                type="text"
                value={productForm.category}
                onChange={(event) => handleProductFieldChange("category", event.target.value)}
                required
              />
            </label>

            <label>
              Description
              <textarea
                rows="4"
                value={productForm.description}
                onChange={(event) => handleProductFieldChange("description", event.target.value)}
              />
            </label>

            <label>
              Price
              <input
                type="text"
                value={productForm.price}
                onChange={(event) => handleProductFieldChange("price", event.target.value)}
              />
            </label>

            <div className="admin-product-specs">
              <h3>Specifications</h3>
              <label>
                Material
                <input
                  type="text"
                  value={productForm.specs.material}
                  onChange={(event) =>
                    handleProductSpecFieldChange("material", event.target.value)
                  }
                />
              </label>
              <label>
                Method
                <input
                  type="text"
                  value={productForm.specs.operation}
                  onChange={(event) =>
                    handleProductSpecFieldChange("operation", event.target.value)
                  }
                />
              </label>
              <label>
                Application
                <input
                  type="text"
                  value={productForm.specs.width}
                  onChange={(event) => handleProductSpecFieldChange("width", event.target.value)}
                />
              </label>
              <label>
                Quality Focus
                <input
                  type="text"
                  value={productForm.specs.finish}
                  onChange={(event) => handleProductSpecFieldChange("finish", event.target.value)}
                />
              </label>
            </div>

            <div className="admin-product-form-actions">
              <button type="submit" className="btn btn-primary">
                {editingProductId ? "Update Product" : "Add Product"}
              </button>
              {editingProductId && (
                <button type="button" className="btn btn-light" onClick={handleCancelEdit}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-product-list">
            {products.length === 0 && (
              <p className="status-message">No products found.</p>
            )}

            {products.map((product) => (
              <article key={product.id} className="admin-card admin-product-card">
                <div className="admin-card-top">
                  <h3>{product.name}</h3>
                  <span className="pill new">{product.category}</span>
                </div>
                <p>{product.description}</p>
                <dl className="spec-grid admin-spec-grid">
                  <div>
                    <dt>Material</dt>
                    <dd>{product.specs?.material || "-"}</dd>
                  </div>
                  <div>
                    <dt>Method</dt>
                    <dd>{product.specs?.operation || "-"}</dd>
                  </div>
                  <div>
                    <dt>Application</dt>
                    <dd>{product.specs?.width || "-"}</dd>
                  </div>
                  <div>
                    <dt>Quality Focus</dt>
                    <dd>{product.specs?.finish || "-"}</dd>
                  </div>
                </dl>
                <p className="admin-product-price">
                  <strong>{product.price || "Price on Request"}</strong>
                </p>
                <div className="admin-product-actions">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => handleEditProduct(product)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDeleteProduct(product)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminDashboardPage;
