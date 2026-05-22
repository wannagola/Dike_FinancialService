import Icon from '../components/Icon';
import type { Account, IconName } from '../types';

const ACCOUNTS: Account[] = [
  { id: '1', bankName: '신한은행', accountNumber: '110-123-456789', balance: 1250000, isMain: true },
  { id: '2', bankName: '카카오뱅크', accountNumber: '333-12-3456789', balance: 320000, isMain: false },
];

const MENUS: { icon: IconName; label: string; desc: string }[] = [
  { icon: 'settings', label: '접근성 설정', desc: '글자 크기, 음성 속도' },
  { icon: 'shield',   label: '보안 설정',   desc: '생체인증, PIN 변경' },
  { icon: 'bell',     label: '알림 설정',   desc: '푸시, SMS 알림' },
  { icon: 'settings', label: '앱 설정',     desc: '언어, 테마' },
];

export default function MyPageTab() {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 animate-slide-in overflow-y-auto scrollbar-none">
      {/* 프로필 */}
      <div className="glass-elev rounded-2xl p-5 flex items-center gap-4 border border-soft">
        <div className="w-14 h-14 rounded-2xl bg-blue-bright/20 flex items-center justify-center">
          <Icon name="user" size={28} color="#60a5fa" />
        </div>
        <div>
          <div className="text-[18px] font-bold text-on">홍길동</div>
          <div className="text-[13px] text-sub">010-1234-5678</div>
        </div>
      </div>

      {/* 등록 계좌 */}
      <div className="flex flex-col gap-2">
        <div className="text-[13px] text-sub px-1">등록 계좌</div>
        {ACCOUNTS.map((acc) => (
          <div key={acc.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-soft">
            <div className="w-9 h-9 rounded-xl bg-white/08 flex items-center justify-center shrink-0">
              <Icon name="bank" size={16} color="rgba(255,255,255,0.7)" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-on">{acc.bankName}</span>
                {acc.isMain && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-bright/20 text-blue-bright">대표</span>
                )}
              </div>
              <div className="text-[11px] text-mute">{acc.accountNumber}</div>
            </div>
            <div className="text-[13px] font-semibold text-on shrink-0">
              {acc.balance.toLocaleString()}원
            </div>
          </div>
        ))}
      </div>

      {/* 설정 메뉴 */}
      <div className="flex flex-col gap-2">
        <div className="text-[13px] text-sub px-1">설정</div>
        {MENUS.map((m) => (
          <button
            key={m.label}
            className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-soft w-full"
          >
            <div className="w-9 h-9 rounded-xl bg-white/08 flex items-center justify-center shrink-0">
              <Icon name={m.icon} size={16} color="rgba(255,255,255,0.7)" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[14px] font-semibold text-on">{m.label}</div>
              <div className="text-[11px] text-mute">{m.desc}</div>
            </div>
            <Icon name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
          </button>
        ))}
      </div>
    </div>
  );
}
