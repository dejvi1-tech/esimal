export async function getAdminHeaders(method: string): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (["POST", "PUT", "DELETE"].includes(method.toUpperCase())) {
    const res = await fetch("/api/admin/csrf-token", { credentials: "include" });
    const data = await res.json();
    const csrf = data.csrfToken;
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  return headers;
} 