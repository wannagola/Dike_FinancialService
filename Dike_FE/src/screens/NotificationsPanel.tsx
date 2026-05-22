import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { getReminders, deleteReminder } from '../api';
import type { Notification, ApiReminder } from '../types';

function reminderToNotif(r: ApiReminder): Notification {
  const dDay = Math.ceil((new Date(r.due_at).getTime() - Date.now()) / 86400000);
  return {
    id: String(r.id),
    title: r.title,
    detail: dDay >= 0 ? `D-${dDay}` : '기한 지남',
    time: new Date(r.notify_at).toLocaleDateString('ko-KR'),
    icon: 'bell',
    urgent: dDay <= 3 && dDay >= 0,
  };
}

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    getReminders().then(list => setNotifs(list.map(reminderToNotif))).catch(() => null);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteReminder(Number(id)).catch(() => null);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };
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
          {notifs.length === 0 && (
            <div className="text-center text-[13px] text-mute py-8">알림이 없습니다.</div>
          )}
          {notifs.map((n) => (
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
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[11px] text-mute">{n.time}</span>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.12)' }}
                >
                  <Icon name="x" size={12} color="rgba(239,68,68,0.7)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
