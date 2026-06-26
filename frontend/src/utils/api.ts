const API_URL = import.meta.env.VITE_API_URL || "";

export async function authFetch(url: string, options: RequestInit = {}) {
  // Fix #6: token is in httpOnly cookie — browser sends it automatically via credentials: "include"
  // Also keep Authorization header fallback for backward compat during migration
  const token = localStorage.getItem("auth_token");

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: "include", // ← sends httpOnly cookie automatically
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Auto-logout on token errors
  if (res.status === 401 || res.status === 403) {
    try {
      const data = await res.clone().json();
      if (
        data?.error === "Invalid or expired token" ||
        data?.error === "No token provided"
      ) {
        // Call logout endpoint to clear httpOnly cookie
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
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
