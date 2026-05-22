import Icon from '../components/Icon';
import type { Transaction } from '../types';

const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'out', name: '스타벅스', category: '카페', amount: 6500, date: '오늘', time: '10:32' },
  { id: '2', type: 'in',  name: '급여',     category: '수입', amount: 3200000, date: '오늘', time: '09:00' },
  { id: '3', type: 'out', name: 'GS25',    category: '편의점', amount: 3200, date: '어제', time: '22:15' },
  { id: '4', type: 'out', name: '한국전력', category: '공과금', amount: 54200, date: '어제', time: '12:00' },
  { id: '5', type: 'out', name: '쿠팡',    category: '쇼핑',  amount: 29000, date: '5/13', time: '18:44' },
  { id: '6', type: 'in',  name: '이자',    category: '수입',  amount: 1200, date: '5/12', time: '00:01' },
];

const thisMonthOut = TRANSACTIONS.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
const thisMonthIn = TRANSACTIONS.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);

export default function HistoryTab() {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 animate-slide-in overflow-y-auto scrollbar-none">
      <h2 className="text-[20px] font-bold text-on">거래내역</h2>

      {/* 월 요약 카드 */}
      <div className="glass-elev rounded-2xl p-4 border border-soft">
        <div className="text-[12px] text-sub mb-3">이번 달</div>
        <div className="flex justify-between">
          <div>
            <div className="text-[11px] text-mute mb-1">입금</div>
            <div className="text-[18px] font-bold" style={{ color: '#10b981' }}>
              +{thisMonthIn.toLocaleString()}원
            </div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-right">
            <div className="text-[11px] text-mute mb-1">출금</div>
            <div className="text-[18px] font-bold" style={{ color: '#ef4444' }}>
              -{thisMonthOut.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>

      {/* 거래 목록 */}
      <div className="flex flex-col gap-2">
        {TRANSACTIONS.map((tx) => (
          <div key={tx.id} className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-soft">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: tx.type === 'in' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}
            >
              <Icon
                name={tx.type === 'in' ? 'arrow-left' : 'arrow-right'}
                size={16}
                color={tx.type === 'in' ? '#10b981' : '#ef4444'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-on truncate">{tx.name}</div>
              <div className="text-[11px] text-mute">{tx.category} · {tx.date} {tx.time}</div>
            </div>
            <div
              className="text-[14px] font-bold shrink-0"
              style={{ color: tx.type === 'in' ? '#10b981' : '#ef4444' }}
            >
              {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString()}원
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
