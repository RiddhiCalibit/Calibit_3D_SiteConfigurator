const API_URL = import.meta.env.VITE_API_URL || "";

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  // Only auto-logout on token-specific errors, not all 403s
  if (res.status === 401) {
    try {
      const data = await res.clone().json();
      if (
        data?.error === "Invalid or expired token" ||
        data?.error === "No token provided"
      ) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_tenant");
        window.location.href = "/";
      }
    } catch {
      // ignore parse errors
    }
  }
  return res;
}
