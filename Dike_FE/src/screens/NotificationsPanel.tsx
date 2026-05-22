import Icon from '../components/Icon';
import type { Notification } from '../types';

const NOTIFS: Notification[] = [
  { id: '1', title: '전기요금 납부 임박', detail: 'D-3 · 54,200원', time: '방금', icon: 'bell', urgent: true },
  { id: '2', title: '급여 입금', detail: '+3,200,000원', time: '1시간 전', icon: 'bank' },
  { id: '3', title: '건강보험 D-7', detail: '128,000원 · 납부 예정', time: '오늘', icon: 'shield' },
  { id: '4', title: '카드 결제', detail: '스타벅스 6,500원', time: '오전 10:32', icon: 'bank' },
];

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  return (
    <div className="absolute inset-0 z-40 animate-fade-in" style={{ background: 'rgba(10,21,48,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
          <span className="text-[18px] font-bold text-on">알림</span>
          <button onClick={onClose} className="w-8 h-8 rounded-xl glass flex items-center justify-center">
            <Icon name="x" size={18} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-3 px-5 py-4 overflow-y-auto scrollbar-none">
          {NOTIFS.map((n) => (
            <div
              key={n.id}
              className="rounded-2xl p-4 border flex items-start gap-3"
              style={{
                background: n.urgent ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.06)',
                borderColor: n.urgent ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: n.urgent ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.08)' }}
              >
                <Icon name={n.icon} size={18} color={n.urgent ? '#fbbf24' : 'rgba(255,255,255,0.7)'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-on">{n.title}</div>
                <div className="text-[12px] text-sub mt-0.5">{n.detail}</div>
                {n.urgent && (
                  <button className="mt-2 px-3 py-1.5 rounded-xl bg-gold/20 border border-gold/30 text-[12px] font-medium" style={{ color: '#fbbf24' }}>
                    지금 납부하기
                  </button>
                )}
              </div>
              <span className="text-[11px] text-mute shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
