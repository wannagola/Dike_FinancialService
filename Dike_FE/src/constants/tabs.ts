import type { Tab } from '../types';

export const TABS: Tab[] = [
  { key: 'home',    label: '홈',     icon: 'wallet'  },
  { key: 'upload',  label: '문서등록', icon: 'upload'  },
  { key: 'inbox',   label: '서류함',  icon: 'folder'  },
  { key: 'history', label: '거래내역', icon: 'history' },
  { key: 'send',    label: '송금',    icon: 'send'    },
  { key: 'my',      label: '마이',    icon: 'user'    },
];

export const TAB_ANNOUNCE: Record<string, string> = {
  home:    '홈 화면입니다. 좌우로 밀어 이동하세요.',
  upload:  '문서 등록 화면입니다.',
  inbox:   '서류함 화면입니다.',
  history: '거래내역 화면입니다.',
  send:    '송금 화면입니다.',
  my:      '마이페이지입니다.',
};
