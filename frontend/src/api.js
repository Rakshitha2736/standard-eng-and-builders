const API = import.meta.env.VITE_API_URL || "https://standard-eng-and-builders.onrender.com";
const API_BASE_URL = `${API}/api`;

const shouldLogApiBase =
  import.meta.env.DEV || String(import.meta.env.VITE_DEBUG_API || "").toLowerCase() === "true";

if (typeof window !== "undefined" && shouldLogApiBase) {
  console.info("[API] Using base URL:", API_BASE_URL);
}

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

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { message: (await response.text()) || `HTTP ${response.status}` };

  if (!response.ok) {
    const normalizedMessage = String(payload.message || "").replace(/<[^>]+>/g, " ").trim();
    throw new Error(normalizedMessage || `HTTP ${response.status}`);
  }

  return payload;
}

export async function fetchProducts() {
  const products = await request("/products");
  
  // Convert all HTTP image URLs to HTTPS for mixed content safety
  return products.map((product) => ({
    ...product,
    image: (product.image || "").replace(/^http:\/\//, "https://")
  }));
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

export function createProduct(product, token) {
  return request("/products", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });
}

export function updateProduct(id, product, token) {
  return request(`/products/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });
}

export function deleteProduct(id, token) {
  return request(`/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
