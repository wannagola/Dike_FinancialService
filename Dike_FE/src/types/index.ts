export type TabKey = 'home' | 'upload' | 'inbox' | 'history' | 'send' | 'my';

export type IconName =
  | 'mic' | 'upload' | 'folder' | 'history' | 'send' | 'user'
  | 'bell' | 'eye' | 'eye-off' | 'wallet' | 'check' | 'x'
  | 'plus' | 'arrow-left' | 'arrow-right' | 'pen' | 'camera'
  | 'volume' | 'shield' | 'settings' | 'chevron-right' | 'bank'
  | 'star' | 'image';

export interface Tab {
  key: TabKey;
  label: string;
  icon: IconName;
}

export interface VoiceState {
  text: string;
  visible: boolean;
}

export interface DragState {
  start: number;
  delta: number;
  active: boolean;
}

export interface Transaction {
  id: string;
  type: 'in' | 'out';
  name: string;
  category: string;
  amount: number;
  date: string;
  time: string;
}

export interface InboxItem {
  id: string;
  name: string;
  org: string;
  amount: number;
  dDay: number;
  urgent: boolean;
  category: 'bill' | 'regular' | 'etc';
  icon: IconName;
}

export interface Contact {
  id: string;
  name: string;
  bank: string;
  account: string;
  avatar: string;
}

export interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  isMain: boolean;
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: IconName;
  urgent?: boolean;
}

/* ── API 응답 타입 ── */

export interface ApiUser {
  id: number;
  login_id: string;
  name: string;
  is_locked: boolean;
  created_at: string;
}

export interface ApiAccount {
  id: number;
  user_id: number;
  bank_code: string;
  account_number: string;
  balance_cache: number;
  is_primary: boolean;
  connected_at: string;
}

export interface ApiTransaction {
  id: number;
  user_id: number;
  from_account_id: number;
  to_account_number: string;
  to_bank_code: string | null;
  amount: number;
  memo: string | null;
  status: string;
  created_at: string;
}

export interface ApiDocument {
  id: number;
  user_id: number;
  category_code: string;
  title: string;
  amount: number | null;
  due_date: string | null;
  partner_name: string | null;
  account_number: string | null;
  s3_url: string | null;
  confidence_score: number | null;
  created_at: string;
}

export interface ApiReminder {
  id: number;
  user_id: number;
  document_id: number | null;
  title: string;
  due_at: string;
  notify_at: string;
  status: string;
  created_at: string;
}

export interface OcrResult {
  raw_text: string;
  category_code: string;
  confidence_score: number;
  parsed: {
    title: string;
    category_code: string;
    amount: number | null;
    due_date: string | null;
    partner_name: string | null;
    account_number: string | null;
    raw_text: string;
  };
}
