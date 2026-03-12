const API_BASE_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const requestHeaders = options.headers || {};
  const mergedHeaders = {
    "Content-Type": "application/json",
    ...requestHeaders
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: mergedHeaders
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export function fetchProducts() {
  return request("/products");
}

export function fetchProduct(id) {
  return request(`/products/${id}`);
}

export function submitEnquiry(data) {
  return request("/enquiries", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function loginAdmin(credentials) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export function fetchEnquiries(token) {
  return request("/enquiries", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function respondToEnquiry(id, response, token) {
  return request(`/enquiries/${id}/respond`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ response })
  });
}
