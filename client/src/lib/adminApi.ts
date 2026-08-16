const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface ApplicationListItem {
  id: number;
  createdAt: string;
  clientType: string;
  clientTypeLabel: string;
  name: string;
  phone: string;
  email: string;
  loanAmount: string | null;
  status: string;
}

export interface ApplicationComment {
  id: number;
  text: string;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  fields: { label: string; value: string }[];
  comments: ApplicationComment[];
}

class AdminApiError extends Error {}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data: (T & { success?: boolean; message?: string }) | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа может отсутствовать, например при 401 без JSON
  }

  if (!response.ok) {
    throw new AdminApiError(data?.message ?? `Ошибка запроса (${response.status})`);
  }
  return data as T;
}

export async function adminLogin(password: string): Promise<void> {
  await adminFetch("/login", { method: "POST", body: JSON.stringify({ password }) });
}

export async function adminLogout(): Promise<void> {
  await adminFetch("/logout", { method: "POST" });
}

export async function adminCheckSession(): Promise<boolean> {
  try {
    await adminFetch("/session");
    return true;
  } catch {
    return false;
  }
}

export async function fetchApplications(status?: string): Promise<ApplicationListItem[]> {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const data = await adminFetch<{ items: ApplicationListItem[] }>(`/applications${qs}`);
  return data.items;
}

export async function fetchApplication(id: number): Promise<ApplicationDetail> {
  const data = await adminFetch<{ item: ApplicationDetail }>(`/applications/${id}`);
  return data.item;
}

export async function updateApplicationStatus(id: number, status: string): Promise<void> {
  await adminFetch(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function addApplicationComment(id: number, text: string): Promise<ApplicationComment> {
  const data = await adminFetch<{ comment: ApplicationComment }>(`/applications/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return data.comment;
}
