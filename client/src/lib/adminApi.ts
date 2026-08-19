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
  lastComment: { text: string; createdAt: string } | null;
}

export interface ApplicationComment {
  id: number;
  text: string;
  createdAt: string;
}

export interface ContractSummary {
  id: number;
  applicationId: number;
  contractNum: number;
  clientType: string;
  clientName: string;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  fields: { label: string; value: string }[];
  comments: ApplicationComment[];
  contracts: ContractSummary[];
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

export async function deleteApplication(id: number): Promise<void> {
  await adminFetch(`/applications/${id}`, { method: "DELETE" });
}

export async function createContract(
  applicationId: number,
  clientType: string,
  data: Record<string, string>
): Promise<ContractSummary> {
  const result = await adminFetch<{ contract: ContractSummary }>(`/applications/${applicationId}/contracts`, {
    method: "POST",
    body: JSON.stringify({ clientType, data }),
  });
  return result.contract;
}

/**
 * Скачивает договор (сервер каждый раз генерирует файл заново из
 * сохранённых данных анкеты — сам файл в базе не хранится) и запускает
 * сохранение в браузере.
 */
export async function downloadContract(contractId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/contracts/${contractId}/download`, {
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Не удалось скачать договор (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // тело ответа не JSON — оставляем сообщение по умолчанию
    }
    throw new AdminApiError(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : "Договор.docx";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
