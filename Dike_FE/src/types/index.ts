export type TabKey = 'home' | 'upload' | 'inbox' | 'history' | 'send' | 'my';

export type IconName =
  | 'mic' | 'upload' | 'folder' | 'history' | 'send' | 'user'
  | 'bell' | 'eye' | 'eye-off' | 'wallet' | 'check' | 'x'
  | 'plus' | 'arrow-left' | 'arrow-right' | 'pen' | 'camera'
  | 'volume' | 'shield' | 'settings' | 'chevron-right' | 'bank'
  | 'star';

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
