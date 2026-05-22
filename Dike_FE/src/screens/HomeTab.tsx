import { useState, useRef, useEffect } from 'react';
import Icon from '../components/Icon';
import { getAccounts, BANK_NAME } from '../api';
import type { ApiAccount } from '../types';

interface HomeTabProps {
  onAnnounce: (text: string) => void;
  onShowNotif: () => void;
  onGoMyPage: () => void;
  onGoSend: () => void;
}

const VOICE_CMDS: { label: string; action: (cb: HomeTabProps, bal: number) => void }[] = [
  { label: '잔액 확인',  action: ({ onAnnounce }, bal) => onAnnounce(`잔액은 ${bal.toLocaleString()}원입니다.`) },
  { label: '이체하기',   action: ({ onGoSend }) => onGoSend() },
  { label: '알림 확인',  action: ({ onShowNotif }) => onShowNotif() },
  { label: '마이페이지', action: ({ onGoMyPage }) => onGoMyPage() },
];

export default function HomeTab(props: HomeTabProps) {
  const { onAnnounce } = props;
  const [hidden, setHidden] = useState(false);
  const [recording, setRecording] = useState(false);
  const [account, setAccount] = useState<ApiAccount | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getAccounts()
      .then(list => setAccount(list.find(a => a.is_primary) ?? list[0] ?? null))
      .catch(() => null);
  }, []);

  const bankName = account ? (BANK_NAME[account.bank_code] ?? account.bank_code) : '—';
  const balance = account?.balance_cache ?? 0;
  const accountNumber = account?.account_number ?? '—';

  const toggleHide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHidden(h => !h);
    onAnnounce(!hidden ? '잔액을 숨깁니다.' : '잔액을 표시합니다.');
  };

  const activateMic = () => {
    if (recording) return;
    setRecording(true);
    onAnnounce('듣고 있습니다...');
    timerRef.current = setTimeout(() => {
      setRecording(false);
      onAnnounce('무엇을 도와드릴까요?');
    }, 3000);
  };

  const stopMic = () => {
    clearTimeout(timerRef.current);
    setRecording(false);
  };

  return (
    /* 전체 영역 탭 → 마이크 활성화 */
    <div
      className="flex flex-col gap-5 px-5 py-4 animate-slide-in overflow-y-auto scrollbar-none h-full"
      onClick={activateMic}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-bright/20 flex items-center justify-center">
            <span className="text-[13px] font-bold text-blue-bright">D</span>
          </div>
          <span className="text-[18px] font-bold text-on tracking-wider">DIKE</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); props.onShowNotif(); }}
          className="relative w-10 h-10 rounded-xl glass flex items-center justify-center"
        >
          <Icon name="bell" size={20} color="rgba(255,255,255,0.8)" />
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-alert" />
        </button>
      </div>

      {/* 계좌 카드 */}
      <div
        className="glass-elev rounded-2xl p-5 border border-soft"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] text-sub">{bankName}</span>
          <button onClick={toggleHide} className="p-1">
            <Icon name={hidden ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        <div className="text-[12px] text-mute mb-3">{accountNumber}</div>
        <div className="text-[32px] font-bold text-on tracking-tight">
          {hidden ? '••••••' : `${balance.toLocaleString()}원`}
        </div>
      </div>

      {/* 메인 마이크 버튼 */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          {/* 펄스 링 — 녹음 중일 때 더 강하게 */}
          <div
            className="absolute inset-0 rounded-full border-2 animate-pulse-ring"
            style={{
              margin: -16,
              borderColor: recording ? 'rgba(96,165,250,0.5)' : 'rgba(96,165,250,0.2)',
            }}
          />
          <div
            className="absolute inset-0 rounded-full border animate-pulse-ring"
            style={{
              margin: -32,
              animationDelay: '0.8s',
              borderColor: recording ? 'rgba(96,165,250,0.3)' : 'rgba(96,165,250,0.1)',
            }}
          />

          <button
            className="w-[140px] h-[140px] rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: recording
                ? 'radial-gradient(circle at 35% 35%, #60a5fa, #1d4ed8)'
                : 'radial-gradient(circle at 35% 35%, #3b82f6, #1e3a6e)',
              boxShadow: recording
                ? '0 0 0 6px rgba(96,165,250,0.25), 0 12px 40px rgba(59,130,246,0.6)'
                : '0 8px 32px rgba(59,130,246,0.4)',
              animation: recording ? 'none' : undefined,
            }}
            onClick={(e) => { e.stopPropagation(); recording ? stopMic() : activateMic(); }}
          >
            {recording ? (
              /* 녹음 중: 파동 */
              <div className="flex items-end gap-[4px]">
                {[1, 2, 3, 4, 5, 4, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-[4px] rounded-full bg-white animate-wave"
                    style={{ height: h * 6, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <Icon name="mic" size={50} color="white" />
            )}
          </button>
        </div>

        <span className="text-[13px] text-sub">
          {recording ? '듣고 있어요 — 탭하면 중지' : '화면을 탭하면 시작해요'}
        </span>
      </div>

      {/* 음성 명령 예시 */}
      <div className="grid grid-cols-2 gap-2">
        {VOICE_CMDS.map(({ label, action }) => (
          <button
            key={label}
            onClick={(e) => { e.stopPropagation(); action(props, balance); }}
            className="glass rounded-xl py-3 px-4 text-[13px] text-sub text-left border border-soft"
          >
            &quot;{label}&quot;
          </button>
        ))}
      </div>
    </div>
  );
}
