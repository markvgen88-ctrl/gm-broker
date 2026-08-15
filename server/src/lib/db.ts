import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Локальная база лидов для мини-CRM (страница /admin на сайте).
 *
 * Зачем нужна отдельно от Telegram/Email/Google Sheets: те три канала —
 * это уведомления "в моменте", по ним неудобно вести статус сделки и
 * заметки по клиенту, а сообщения/письма легко потерять в истории чата
 * или почтового ящика. Здесь же каждая заявка — это строка с историей
 * статусов и заметок, доступная в любой момент через /admin.
 *
 * Хранилище — файл SQLite (без внешней БД и без затрат на хостинг).
 * Путь можно переопределить переменной окружения DB_PATH — полезно, если
 * хостинг предоставляет отдельный persistent-диск не в папке проекта.
 */

const DATA_DIR = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.resolve(__dirname, "../../data");
const DB_FILE = process.env.DB_PATH ?? path.join(DATA_DIR, "leads.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    client_type TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    loan_amount TEXT,
    loan_purpose TEXT,
    answers_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
  );

  CREATE TABLE IF NOT EXISTS lead_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
`);

// ---------------- Статусы сделки ----------------

export const LEAD_STATUSES = [
  "new",
  "in_progress",
  "waiting_docs",
  "submitted",
  "approved",
  "declined",
  "issued",
  "archived",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

// ---------------- Лиды ----------------

export interface LeadRow {
  id: number;
  created_at: string;
  updated_at: string;
  client_type: string;
  name: string;
  phone: string;
  email: string;
  loan_amount: string | null;
  loan_purpose: string | null;
  answers_json: string;
  status: LeadStatus;
}

export interface NewLeadInput {
  createdAt: string;
  clientType: string;
  name: string;
  phone: string;
  email: string;
  loanAmount: string | null;
  loanPurpose: string | null;
  answers: Record<string, string | number>;
}

const insertLeadStmt = db.prepare(`
  INSERT INTO leads (created_at, updated_at, client_type, name, phone, email, loan_amount, loan_purpose, answers_json, status)
  VALUES (@created_at, @updated_at, @client_type, @name, @phone, @email, @loan_amount, @loan_purpose, @answers_json, 'new')
`);

export function insertLead(input: NewLeadInput): LeadRow {
  const now = input.createdAt;
  const result = insertLeadStmt.run({
    created_at: now,
    updated_at: now,
    client_type: input.clientType,
    name: input.name,
    phone: input.phone,
    email: input.email,
    loan_amount: input.loanAmount,
    loan_purpose: input.loanPurpose,
    answers_json: JSON.stringify(input.answers),
  });
  return getLeadById(Number(result.lastInsertRowid))!;
}

export function listLeads(): LeadRow[] {
  return db.prepare(`SELECT * FROM leads ORDER BY datetime(created_at) DESC`).all() as LeadRow[];
}

export function getLeadById(id: number): LeadRow | null {
  const row = db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id) as LeadRow | undefined;
  return row ?? null;
}

export function updateLeadStatus(id: number, status: LeadStatus): LeadRow | null {
  const existing = getLeadById(id);
  if (!existing) return null;
  db.prepare(`UPDATE leads SET status = ?, updated_at = ? WHERE id = ?`).run(status, new Date().toISOString(), id);
  return getLeadById(id);
}

// ---------------- Заметки по клиенту ----------------

export interface NoteRow {
  id: number;
  lead_id: number;
  text: string;
  created_at: string;
}

export function listLeadNotes(leadId: number): NoteRow[] {
  return db.prepare(`SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY datetime(created_at) DESC`).all(leadId) as NoteRow[];
}

export function addLeadNote(leadId: number, text: string): NoteRow | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;
  const now = new Date().toISOString();
  const result = db
    .prepare(`INSERT INTO lead_notes (lead_id, text, created_at) VALUES (?, ?, ?)`)
    .run(leadId, text, now);
  // Заметка обновляет "последнюю активность" по лиду — удобно сортировать/видеть, что по клиенту недавно что-то происходило.
  db.prepare(`UPDATE leads SET updated_at = ? WHERE id = ?`).run(now, leadId);
  return db.prepare(`SELECT * FROM lead_notes WHERE id = ?`).get(result.lastInsertRowid) as NoteRow;
}

// ---------------- Сессии админки ----------------

export interface SessionRow {
  token: string;
  created_at: string;
  expires_at: string;
}

export function createSession(token: string, createdAt: string, expiresAt: string): void {
  db.prepare(`INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)`).run(
    token,
    createdAt,
    expiresAt
  );
}

export function getSession(token: string): SessionRow | null {
  const row = db.prepare(`SELECT * FROM admin_sessions WHERE token = ?`).get(token) as SessionRow | undefined;
  return row ?? null;
}

export function deleteSession(token: string): void {
  db.prepare(`DELETE FROM admin_sessions WHERE token = ?`).run(token);
}

export function deleteExpiredSessions(): void {
  db.prepare(`DELETE FROM admin_sessions WHERE datetime(expires_at) < datetime('now')`).run();
}
