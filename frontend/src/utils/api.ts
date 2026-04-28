// export async function authFetch(url: string, options: RequestInit = {}) {
//   const token = localStorage.getItem('authToken');
//   const res = await fetch(url, {
//     ...options,
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
//       ...options.headers,
//     }
//   });

//   //  Auto logout when token is expired or invalid
//   if (res.status === 401 || res.status === 403) {
//     const data = await res.clone().json().catch(() => null);
    
//     // Only force logout for token issues, not permission errors
//     if (data?.error === 'Invalid or expired token' || data?.error === 'No token provided') {
//       localStorage.removeItem('authToken');
//       window.location.href = '/'; // kick back to login
//     }
//   }

//   return res;
// }

const API_URL = import.meta.env.VITE_API_URL;

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    }
  });
  // Only auto-logout on token-specific errors, not all 403s
  if (res.status === 401) {
    try {
      const data = await res.clone().json();
      if (data?.error === 'Invalid or expired token' || 
          data?.error === 'No token provided'
          ) {
        localStorage.removeItem('authToken');
        window.location.href = '/';
      }
    } catch {
      // ignore parse errors
    }
  }
  return res;
}