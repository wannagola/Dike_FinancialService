import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { getTransactions, deleteTransaction, BANK_NAME } from '../api';
import type { Transaction, ApiTransaction } from '../types';

function txFromApi(tx: ApiTransaction): Transaction {
  const dt = new Date(tx.created_at);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dateStr =
    dt.toDateString() === today.toDateString() ? '오늘' :
    dt.toDateString() === yesterday.toDateString() ? '어제' :
    `${dt.getMonth() + 1}/${dt.getDate()}`;
  const timeStr = dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const bankName = tx.to_bank_code ? (BANK_NAME[tx.to_bank_code] ?? tx.to_bank_code) : null;
  const name = tx.memo || (bankName ? `${bankName} ${tx.to_account_number}` : tx.to_account_number);
  return {
    id: String(tx.id),
    type: 'out',
    name,
    category: bankName ?? '송금',
    amount: tx.amount,
    date: dateStr,
    time: timeStr,
  };
}

export default function HistoryTab() {
  const [txList, setTxList] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactions()
      .then(list => setTxList(list.map(txFromApi)))
      .catch(() => null);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteTransaction(Number(id)).catch(() => null);
    setTxList(prev => prev.filter(t => t.id !== id));
  };

  const thisMonthOut = txList.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const thisMonthIn  = txList.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);

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

      {txList.length === 0 && (
        <div className="text-center text-[13px] text-mute py-8">거래 내역이 없습니다.</div>
      )}

      {/* 거래 목록 */}
      <div className="flex flex-col gap-2">
        {txList.map((tx) => (
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
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-[14px] font-bold" style={{ color: tx.type === 'in' ? '#10b981' : '#ef4444' }}>
                {tx.type === 'in' ? '+' : '-'}{tx.amount.toLocaleString()}원
              </div>
              <button
                onClick={() => handleDelete(tx.id)}
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
  );
}
