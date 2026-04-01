export function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("authToken");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options.headers,
    }
  });
}
