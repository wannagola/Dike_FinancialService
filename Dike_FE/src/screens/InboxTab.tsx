import { useState } from 'react';
import Icon from '../components/Icon';
import type { InboxItem } from '../types';

const PERIOD_OPTIONS = ['없음', '1주일', '한 달', '분기', '반기', '1년'];

interface ItemDetail {
  date: string;
  myAccount: string;
  period: string;
}

const ITEMS: InboxItem[] = [
  { id: '1', name: '전기요금',  org: '한국전력',       amount: 54200,  dDay: 3,  urgent: true,  category: 'bill',    icon: 'settings' },
  { id: '2', name: '건강보험',  org: '국민건강보험공단', amount: 128000, dDay: 7,  urgent: false, category: 'regular', icon: 'shield'   },
  { id: '3', name: '도시가스',  org: '서울도시가스',    amount: 32400,  dDay: 10, urgent: false, category: 'bill',    icon: 'settings' },
  { id: '4', name: '넷플릭스',  org: 'Netflix',        amount: 17000,  dDay: 15, urgent: false, category: 'regular', icon: 'star'     },
  { id: '5', name: '국민연금',  org: '국민연금공단',    amount: 225000, dDay: 20, urgent: false, category: 'regular', icon: 'bank'     },
];

const DETAILS: Record<string, ItemDetail> = {
  '1': { date: '2026-05-25', myAccount: '신한은행 110-123-456789', period: '한 달'  },
  '2': { date: '2026-05-20', myAccount: '신한은행 110-123-456789', period: '한 달'  },
  '3': { date: '2026-05-22', myAccount: '신한은행 110-123-456789', period: '한 달'  },
  '4': { date: '2026-05-18', myAccount: '신한은행 110-123-456789', period: '한 달'  },
  '5': { date: '2026-05-25', myAccount: '신한은행 110-123-456789', period: '한 달'  },
};

const CATS = ['전체', '고지서', '정기지출'];

export default function InboxTab() {
  const [cat, setCat] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = cat === 0 ? ITEMS
    : cat === 1 ? ITEMS.filter(i => i.category === 'bill')
    : ITEMS.filter(i => i.category === 'regular');

  const selectedItem = ITEMS.find(i => i.id === selectedId);
  const selectedDetail = selectedId ? DETAILS[selectedId] : null;

  return (
    <div className="relative h-full">
      {/* 목록 */}
      <div className="flex flex-col gap-4 px-5 py-4 animate-slide-in overflow-y-auto scrollbar-none h-full">
        <h2 className="text-[20px] font-bold text-on">서류함</h2>

        {/* 카테고리 탭 */}
        <div className="flex gap-2">
          {CATS.map((c, i) => (
            <button
              key={c}
              onClick={() => setCat(i)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
              style={{
                background: cat === i ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: cat === i ? 'white' : 'rgba(255,255,255,0.6)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 항목 목록 */}
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="rounded-2xl p-4 border flex items-center gap-3 w-full text-left"
              style={{
                background: item.urgent ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.06)',
                borderColor: item.urgent ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.12)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.urgent ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.08)' }}
              >
                <Icon name={item.icon} size={18} color={item.urgent ? '#fbbf24' : 'rgba(255,255,255,0.7)'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-on">{item.name}</div>
                <div className="text-[11px] text-mute">{item.org}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-bold text-on">{item.amount.toLocaleString()}원</div>
                <div
                  className="text-[11px] font-medium"
                  style={{ color: item.dDay <= 5 ? '#fbbf24' : 'rgba(255,255,255,0.5)' }}
                >
                  D-{item.dDay}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 상세 오버레이 */}
      {selectedItem && selectedDetail && (
        <InboxDetail
          item={selectedItem}
          detail={selectedDetail}
          onClose={() => setSelectedId(null)}
          onDetailChange={(updated) => {
            Object.assign(DETAILS[selectedItem.id], updated);
          }}
        />
      )}
    </div>
  );
}

/* ── 상세 화면 ── */
interface InboxDetailProps {
  item: InboxItem;
  detail: ItemDetail;
  onClose: () => void;
  onDetailChange: (d: Partial<ItemDetail>) => void;
}

function InboxDetail({ item, detail, onClose }: InboxDetailProps) {
  const [period, setPeriod] = useState(detail.period);

  const rows = [
    { label: '제목',            value: item.name              },
    { label: '일자',            value: detail.date            },
    { label: '거래 계좌 (상대)', value: item.org               },
    { label: '거래 계좌 (내 것)', value: detail.myAccount     },
    { label: '금액',            value: `${item.amount.toLocaleString()}원` },
  ];

  return (
    <div className="absolute inset-0 bg-navy flex flex-col animate-slide-in z-10">
      {/* 헤더 */}
      <div className="flex items-center px-5 py-4 border-b border-soft shrink-0">
        <button onClick={onClose} className="p-1 mr-2">
          <Icon name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
        </button>
        <span className="text-[17px] font-bold text-on flex-1 text-center pr-7">
          {item.name}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 flex flex-col gap-3">
        {/* D-day 배지 */}
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between border"
          style={{
            background: item.urgent ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.06)',
            borderColor: item.urgent ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.12)',
          }}
        >
          <span className="text-[13px] text-sub">납부까지</span>
          <span
            className="text-[18px] font-bold"
            style={{ color: item.urgent ? '#fbbf24' : 'rgba(255,255,255,0.9)' }}
          >
            D-{item.dDay}
          </span>
        </div>

        {/* 기본 필드 */}
        {rows.map(({ label, value }) => (
          <div key={label} className="glass rounded-xl px-4 py-3 border border-soft">
            <div className="text-[11px] text-mute mb-1">{label}</div>
            <div className="text-[15px] font-semibold text-on">{value}</div>
          </div>
        ))}

        {/* 주기 — 선택 가능 */}
        <div className="glass rounded-xl px-4 py-3 border border-soft">
          <div className="text-[11px] text-mute mb-3">주기</div>
          <div className="grid grid-cols-3 gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setPeriod(opt)}
                className="py-2.5 rounded-xl text-[13px] font-medium border transition-all"
                style={{
                  background: period === opt ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                  borderColor: period === opt ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: period === opt ? '#93c5fd' : 'rgba(255,255,255,0.7)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 닫기 */}
      <div className="px-5 pb-6 pt-3 shrink-0">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-blue-main text-white font-semibold text-[15px]"
        >
          확인
        </button>
      </div>
    </div>
  );
}
