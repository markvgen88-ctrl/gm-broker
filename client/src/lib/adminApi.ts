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
  /** Сколько заявок этого же клиента пришло раньше этой (0 — первая). */
  earlierCount: number;
  /** Сколько заявок этого же клиента пришло позже этой. */
  laterCount: number;
}

/** Другая заявка того же клиента (совпал телефон и/или e-mail). */
export interface RelatedApplication {
  id: number;
  createdAt: string;
  clientTypeLabel: string;
  loanAmount: string | null;
  status: string;
  sameBy: { phone: boolean; email: boolean };
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

/** Письмо клиенту, отправленное из карточки заявки. */
export interface ApplicationMessage {
  id: number;
  toEmail: string;
  subject: string;
  body: string;
  attachments: { name: string; size: number }[];
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  telegram: string | null;
  fields: { key: string; label: string; value: string; tone: "good" | "bad" | "neutral" }[];
  comments: ApplicationComment[];
  contracts: ContractSummary[];
  messages: ApplicationMessage[];
  related: RelatedApplication[];
}

/** Заявка по услуге (заморозка, банкротство и т. д.) — отдельный раздел CRM. */
export interface ServiceRequestListItem {
  id: number;
  createdAt: string;
  service: string;
  serviceTitle: string;
  name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  /** Комментарий клиента из формы на сайте */
  clientComment: string | null;
  status: string;
  /** Ответы мини-опроса (кредитные каникулы); у других услуг — пусто */
  answers: { question: string; answer: string }[];
  lastComment: { text: string; createdAt: string } | null;
}

export interface ServiceRequestDetail extends ServiceRequestListItem {
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
    // no-store: браузер не должен подставлять запомненный ответ 401, полученный
    // до входа (например, на странице логина), — иначе сразу после входа
    // проверка сессии «видит» старый отказ и возвращает на форму.
    await adminFetch("/session", { cache: "no-store" });
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

/**
 * Отправляет письмо клиенту с вложениями (multipart). Возвращает запись для
 * истории, либо null, если письмо ушло, но в историю не записалось.
 */
export async function sendApplicationMessage(
  id: number,
  payload: { subject: string; body: string; files: File[]; contractIds: number[] }
): Promise<ApplicationMessage | null> {
  const form = new FormData();
  form.append("subject", payload.subject);
  form.append("body", payload.body);
  if (payload.contractIds.length > 0) form.append("contractIds", JSON.stringify(payload.contractIds));
  payload.files.forEach((file) => form.append("files", file, file.name));

  // Content-Type не задаём: браузер сам проставит multipart с границей.
  const response = await fetch(`${API_BASE_URL}/admin/applications/${id}/messages`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  let data: { message?: string; sentMessage?: ApplicationMessage | null } | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа не JSON
  }
  if (!response.ok) {
    throw new AdminApiError(data?.message ?? `Не удалось отправить письмо (${response.status})`);
  }
  return data?.sentMessage ?? null;
}

/** Шаблон письма клиенту (редактируется в разделе «Шаблоны писем»). */
export interface EmailTemplate {
  id: number;
  label: string;
  subject: string;
  body: string;
}

export async function fetchEmailTemplates(): Promise<{ templates: EmailTemplate[]; signature: string }> {
  const data = await adminFetch<{ templates: EmailTemplate[]; signature: string }>("/email-templates", {
    cache: "no-store",
  });
  return { templates: data.templates, signature: data.signature };
}

export async function createEmailTemplate(payload: Omit<EmailTemplate, "id">): Promise<EmailTemplate> {
  const data = await adminFetch<{ template: EmailTemplate }>("/email-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.template;
}

export async function updateEmailTemplate(id: number, payload: Omit<EmailTemplate, "id">): Promise<EmailTemplate> {
  const data = await adminFetch<{ template: EmailTemplate }>(`/email-templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return data.template;
}

export async function deleteEmailTemplate(id: number): Promise<void> {
  await adminFetch(`/email-templates/${id}`, { method: "DELETE" });
}

export async function saveEmailSignature(signature: string): Promise<string> {
  const data = await adminFetch<{ signature: string }>("/email-signature", {
    method: "PUT",
    body: JSON.stringify({ signature }),
  });
  return data.signature;
}

/** Настройки опроса на сайте (вкладка «Настройки опроса»). */
export interface SurveySettings {
  /** Минимальная сумма кредита, ₽. 0 — без ограничения. */
  minLoanAmount: number;
}

export async function fetchAdminSurveySettings(): Promise<SurveySettings> {
  const data = await adminFetch<{ settings: SurveySettings }>("/survey-settings", { cache: "no-store" });
  return data.settings;
}

export async function saveMinLoanAmount(minLoanAmount: number): Promise<SurveySettings> {
  const data = await adminFetch<{ settings: SurveySettings }>("/survey-settings", {
    method: "PUT",
    body: JSON.stringify({ minLoanAmount }),
  });
  return data.settings;
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

/**
 * Скачивает все заявки одним листом Excel. Файл собирается на сервере в
 * момент нажатия, поэтому всегда содержит свежие заявки и комментарии.
 * Если передан статус, в файл попадают только заявки с этим статусом.
 */
export async function downloadApplicationsExcel(status?: string): Promise<void> {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetch(`${API_BASE_URL}/admin/applications/export.xlsx${qs}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Не удалось скачать Excel (${response.status})`;
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
  const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : "Заявки.xlsx";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteContract(contractId: number): Promise<void> {
  await adminFetch(`/contracts/${contractId}`, { method: "DELETE" });
}

export async function fetchServiceRequests(): Promise<ServiceRequestListItem[]> {
  const data = await adminFetch<{ items: ServiceRequestListItem[] }>("/service-requests");
  return data.items;
}

export async function fetchServiceRequest(id: number): Promise<ServiceRequestDetail> {
  const data = await adminFetch<{ item: ServiceRequestDetail }>(`/service-requests/${id}`);
  return data.item;
}

export async function updateServiceRequestStatus(id: number, status: string): Promise<void> {
  await adminFetch(`/service-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function addServiceRequestComment(id: number, text: string): Promise<ApplicationComment> {
  const data = await adminFetch<{ comment: ApplicationComment }>(`/service-requests/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return data.comment;
}

export async function deleteServiceRequest(id: number): Promise<void> {
  await adminFetch(`/service-requests/${id}`, { method: "DELETE" });
}
