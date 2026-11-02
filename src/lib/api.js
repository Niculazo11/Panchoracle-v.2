const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const AUTH_EXPIRED_EVENT = "auth:expired";

export class ApiError extends Error {
  constructor(status, data, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, { signal, body, headers = {} } = {}) {
  const hasBody = body !== undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    credentials: "same-origin",
    headers: { ...(hasBody ? { "Content-Type": "application/json" } : {}), ...headers },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch { data = null; }
  }

  if (!res.ok) {
    const isAuthEntry = /^\/auth\/(login|register)(\/|$|\?)/.test(path);
    if (res.status === 401 && !isAuthEntry) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, data, data?.error?.message || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
  request,
};