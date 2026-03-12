import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { fetchEnquiries, loginAdmin, respondToEnquiry } from "../api";

const ADMIN_TOKEN_KEY = "standard_admin_token";

function AdminDashboardPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [responseDrafts, setResponseDrafts] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [credentials, setCredentials] = useState({ username: "", password: "" });

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
          setStatusMessage("");
          return;
        }
        setStatusMessage(error.message);
      });
  }

  useEffect(() => {
    if (token) {
      loadEnquiries(token);
    }
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setStatusMessage("");

    try {
      const payload = await loginAdmin(credentials);
      localStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
      setToken(payload.token);
      setCredentials({ username: "", password: "" });
      setStatusMessage("Admin login successful.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setEnquiries([]);
    setStatusMessage("Logged out.");
  }

  async function handleRespond(id) {
    const draftKey = String(id);
    const text = (responseDrafts[draftKey] || "").trim();

    if (!text) {
      setStatusMessage("Please enter a response message.");
      return;
    }

    try {
      const payload = await respondToEnquiry(id, text, token);
      setStatusMessage(payload.message || "Response saved.");
      setResponseDrafts((prev) => ({ ...prev, [draftKey]: "" }));
      loadEnquiries(token);
    } catch (error) {
      setStatusMessage(error.message);
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

        {statusMessage && <p className="status-message">{statusMessage}</p>}

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
        <h1>Customer Enquiries</h1>
        <button type="button" className="btn btn-light admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      <div className="admin-list">
        {enquiries.length === 0 && (
          <p className="status-message">No enquiries submitted yet.</p>
        )}

        {enquiries.map((enquiry) => (
          <article key={enquiry.id} className="admin-card">
            <div className="admin-card-top">
              <h3>{enquiry.name}</h3>
              <span className={`pill ${enquiry.status}`}>{enquiry.status}</span>
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
              disabled={!((responseDrafts[String(enquiry.id)] || "").trim())}
            >
              Send Response
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminDashboardPage;
