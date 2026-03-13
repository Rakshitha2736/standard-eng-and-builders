import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import { fetchEnquiries, loginAdmin, respondToEnquiry } from "../api";

const ADMIN_TOKEN_KEY = "standard_admin_token";

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

function AdminDashboardPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [responseDrafts, setResponseDrafts] = useState({});
  const [statusMessage, setStatusMessage] = useState(buildStatusMessage());
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
          setStatusMessage(buildStatusMessage());
          return;
        }
        setStatusMessage(buildStatusMessage(error.message, "error"));
      });
  }

  useEffect(() => {
    if (token) {
      loadEnquiries(token);
    }
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setStatusMessage(buildStatusMessage());

    try {
      const payload = await loginAdmin(credentials);
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
    setToken("");
    setEnquiries([]);
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
        <h1>Customer Enquiries</h1>
        <button type="button" className="btn btn-light admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {statusMessage.text && (
        <p className={`status-message ${statusMessage.tone}`.trim()}>{statusMessage.text}</p>
      )}

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
    </section>
  );
}

export default AdminDashboardPage;
