const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type LeadStatus =
  | "new"
  | "in_progress"
  | "waiting_docs"
  | "submitted"
  | "approved"
  | "declined"
  | "issued"
  | "archived";

export interface Lead {
  id: number;
  created_at: string;
  updated_at: string;
  client_type: "individual" | "entrepreneur" | "legal_entity";
  name: string;
  phone: string;
  email: string;
  loan_amount: string | null;
  loan_purpose: string | null;
  answers_json: string;
  status: LeadStatus;
}

export interface LeadNote {
  id: number;
  lead_id: number;
  text: string;
  created_at: string;
}

interface ApiResult {
  success?: boolean;
  message?: string;
}

async function parseJson<T>(response: Response): Promise<T> {
  let data: (T & ApiResult) | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа может отсутствовать при сетевой ошибке
  }
  if (!response.ok) {
    throw new Error(data?.message ?? "Не удалось выполнить запрос");
  }
  return data as T;
}

export async function adminLogin(password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });
  await parseJson<ApiResult>(res);
}

export async function adminLogout(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/logout`, {
    method: "POST",
    credentials: "include",
  });
  await parseJson<ApiResult>(res);
}

export async function adminCheckSession(): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/me`, { credentials: "include" });
  const data = await parseJson<{ authenticated: boolean }>(res);
  return data.authenticated;
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_BASE_URL}/admin/leads`, { credentials: "include" });
  const data = await parseJson<{ leads: Lead[] }>(res);
  return data.leads;
}

export async function updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  const data = await parseJson<{ lead: Lead }>(res);
  return data.lead;
}

export async function fetchLeadNotes(id: number): Promise<LeadNote[]> {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/notes`, { credentials: "include" });
  const data = await parseJson<{ notes: LeadNote[] }>(res);
  return data.notes;
}

export async function addLeadNote(id: number, text: string): Promise<LeadNote> {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ text }),
  });
  const data = await parseJson<{ note: LeadNote }>(res);
  return data.note;
}
