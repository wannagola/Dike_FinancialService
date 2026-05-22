import { api, setTokens, clearTokens } from './client';
import type {
  ApiUser, ApiAccount, ApiTransaction,
  ApiDocument, ApiReminder, OcrResult,
} from '../types';

type Res<T> = { data: T; tts: string };

/* ── 은행 코드 매핑 ── */
export const BANK_CODE: Record<string, string> = {
  '국민은행': '004', '우리은행': '020', '신한은행': '088',
  '하나은행': '081', '기업은행': '003', '농협은행': '011',
  '케이뱅크': '089', '카카오뱅크': '090', '토스뱅크': '092',
};
export const BANK_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(BANK_CODE).map(([k, v]) => [v, k]),
);

/* ── 인증 ── */
export async function login(login_id: string, password: string) {
  const res = await api<Res<{ access_token: string; refresh_token: string }>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login_id, password }),
  });
  setTokens(res.data.access_token, res.data.refresh_token);
  return res;
}

export async function register(login_id: string, password: string, name: string) {
  return api<Res<ApiUser>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ login_id, password, name }),
  });
}

export function logout(refresh_token: string) {
  clearTokens();
  return api('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) }).catch(() => null);
}

export async function unlockAccount(login_id: string, password: string) {
  return api('/auth/unlock', { method: 'POST', body: JSON.stringify({ login_id, password }) });
}

/* ── 사용자 ── */
export async function getMe() {
  const res = await api<Res<ApiUser>>('/users/me');
  return res.data;
}

export async function updateMe(data: { name?: string; password?: string }) {
  const res = await api<Res<ApiUser>>('/users/me', { method: 'PUT', body: JSON.stringify(data) });
  return res.data;
}

export async function deleteMe() {
  return api('/users/me', { method: 'DELETE' });
}

/* ── 계좌 ── */
export async function getAccounts() {
  const res = await api<Res<ApiAccount[]>>('/accounts');
  return res.data;
}

export async function createAccount(bank_code: string, account_number: string, is_primary = false) {
  const res = await api<Res<ApiAccount>>('/accounts', {
    method: 'POST',
    body: JSON.stringify({ bank_code, account_number, is_primary }),
  });
  return res.data;
}

export async function setPrimaryAccount(account_id: number) {
  const res = await api<Res<ApiAccount>>(`/accounts/${account_id}/primary`, { method: 'PATCH' });
  return res.data;
}

export async function deleteAccount(account_id: number) {
  return api(`/accounts/${account_id}`, { method: 'DELETE' });
}

export async function updateBalance(account_id: number, balance: number) {
  const res = await api<Res<ApiAccount>>(`/accounts/${account_id}/balance`, {
    method: 'PATCH',
    body: JSON.stringify({ balance }),
  });
  return res.data;
}

/* ── 거래 ── */
export async function getTransactions() {
  const res = await api<Res<ApiTransaction[]>>('/transactions');
  return res.data;
}

export async function deleteTransaction(transaction_id: number) {
  return api(`/transactions/${transaction_id}`, { method: 'DELETE' });
}

export async function sendMoney(
  from_account_id: number,
  to_account_number: string,
  amount: number,
  to_bank_code?: string,
  memo?: string,
) {
  const res = await api<Res<ApiTransaction>>('/transactions', {
    method: 'POST',
    body: JSON.stringify({ from_account_id, to_account_number, to_bank_code, amount, memo }),
  });
  return res;
}

/* ── 문서 ── */
export async function getDocuments() {
  const res = await api<Res<ApiDocument[]>>('/documents');
  return res.data;
}

export async function ocrPreview(file: File): Promise<OcrResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await api<Res<OcrResult>>('/documents/ocr', { method: 'POST', body: form });
  return res.data;
}

export async function ocrSave(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await api<Res<ApiDocument>>('/documents/ocr/save', { method: 'POST', body: form });
  return res;
}

export async function createDocument(doc: {
  title: string; category_code: string; amount?: number;
  due_date?: string; partner_name?: string;
}) {
  const res = await api<Res<ApiDocument>>('/documents', {
    method: 'POST',
    body: JSON.stringify(doc),
  });
  return res;
}

export async function deleteDocument(document_id: number) {
  return api(`/documents/${document_id}`, { method: 'DELETE' });
}

/* ── 알림 ── */
export async function getReminders() {
  const res = await api<Res<ApiReminder[]>>('/reminders');
  return res.data;
}

export async function createReminder(data: {
  document_id?: number; title: string;
  due_at: string; notify_at?: string;
}) {
  const res = await api<Res<ApiReminder>>('/reminders', { method: 'POST', body: JSON.stringify(data) });
  return res.data;
}

export async function deleteReminder(reminder_id: number) {
  return api(`/reminders/${reminder_id}`, { method: 'DELETE' });
}
