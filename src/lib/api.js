const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(public status, public data, message) {
    super(message);
    this.name = "ApiError";
  }
}

async function request(method, path, { signal, body, headers = {} } = {}) {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new ApiError(res.status, data, data.message || `HTTP ${res.status}`);
  }

  return res.status === 204 ? null : data;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
  request,
};