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

// Mock de desarrollo para UN-202 (se elimina cuando exista backend real UN-104)
if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  const MOCK_USERS = {
    "student@test.com": { id: "1", email: "student@test.com", role: "student" },
    "teacher@test.com": { id: "2", email: "teacher@test.com", role: "teacher" },
  };
  const MOCK_PASSWORDS = { "student@test.com": "123456", "teacher@test.com": "123456" };
  let mockToken = null;

  const originalFetch = window.fetch;
  window.fetch = async (url, opts = {}) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("/api/auth/")) {
      if (urlStr.includes("/api/auth/login") && opts.method === "POST") {
        const body = JSON.parse(opts.body || "{}");
        const user = MOCK_USERS[body.email];
        if (user && MOCK_PASSWORDS[body.email] === body.password) {
          mockToken = "mock-token-" + Date.now();
          return new Response(JSON.stringify({ token: mockToken, user }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Credenciales inválidas" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/api/auth/me") && opts.method === "GET") {
        if (mockToken) {
          return new Response(JSON.stringify({ user: MOCK_USERS["student@test.com"] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "No autenticado" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/api/auth/logout") && opts.method === "POST") {
        mockToken = null;
        return new Response(null, { status: 204 });
      }
    }
    return originalFetch(url, opts);
  };
}