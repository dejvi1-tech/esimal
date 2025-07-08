export async function getAdminHeaders(method: string): Promise<HeadersInit> {
  const token = localStorage.getItem("admin_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };

  if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
    let csrf = localStorage.getItem("csrf_token");
    if (!csrf) {
      const res = await fetch("/api/admin/csrf-token", { credentials: "include" });
      const data = await res.json();
      csrf = data.csrfToken;
      if (csrf) localStorage.setItem("csrf_token", csrf);
    }
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  return headers;
} 