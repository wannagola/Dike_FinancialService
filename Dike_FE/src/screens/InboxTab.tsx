import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { getDocuments, deleteDocument, createReminder } from '../api';
import type { InboxItem, ApiDocument, IconName } from '../types';

const PERIOD_OPTIONS = ['없음', '1주일', '한 달', '분기', '반기', '1년'];

interface ItemDetail {
  date: string;
  myAccount: string;
  period: string;
}

function docToItem(doc: ApiDocument): InboxItem {
  const dDay = doc.due_date
    ? Math.ceil((new Date(doc.due_date).getTime() - Date.now()) / 86400000)
    : 999;
  const iconMap: Record<string, IconName> = {
    CAT_01: 'settings', CAT_02: 'send', CAT_03: 'bank',
    CAT_04: 'history',  CAT_05: 'bank', CAT_06: 'shield',
    CAT_07: 'shield',   CAT_99: 'folder',
  };
  const catMap = (code: string): 'bill' | 'regular' | 'etc' => {
    if (['CAT_01', 'CAT_07'].includes(code)) return 'bill';
    if (['CAT_04', 'CAT_05', 'CAT_06'].includes(code)) return 'regular';
    return 'etc';
  };
  return {
    id: String(doc.id),
    name: doc.title,
    org: doc.partner_name ?? '',
    amount: doc.amount ?? 0,
    dDay: Math.max(0, dDay),
    urgent: dDay <= 5 && dDay >= 0,
    category: catMap(doc.category_code),
    icon: iconMap[doc.category_code] ?? 'folder',
  };
}

const CATS = ['전체', '고지서', '정기지출'];

export default function InboxTab() {
  const [cat, setCat] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [details, setDetails] = useState<Record<string, ItemDetail>>({});
  const [rawDocs, setRawDocs] = useState<ApiDocument[]>([]);

  useEffect(() => {
    getDocuments().then(docs => {
      setRawDocs(docs);
      setItems(docs.map(docToItem));
      const det: Record<string, ItemDetail> = {};
      docs.forEach(doc => {
        det[String(doc.id)] = {
          date: doc.due_date ? doc.due_date.slice(0, 10) : '—',
          myAccount: doc.account_number ?? '—',
          period: '한 달',
        };
      });
      setDetails(det);
    }).catch(() => null);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDocument(Number(id)).catch(() => null);
    setItems(prev => prev.filter(i => i.id !== id));
    setRawDocs(prev => prev.filter(d => String(d.id) !== id));
    setSelectedId(null);
  };

  const filtered = cat === 0 ? items
    : cat === 1 ? items.filter(i => i.category === 'bill')
    : items.filter(i => i.category === 'regular');

  const selectedItem = items.find(i => i.id === selectedId);
  const selectedDetail = selectedId ? details[selectedId] : null;

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
          rawDoc={rawDocs.find(d => String(d.id) === selectedItem.id) ?? null}
          onClose={() => setSelectedId(null)}
          onDelete={() => handleDelete(selectedItem.id)}
          onDetailChange={(updated) => {
            setDetails(prev => ({
              ...prev,
              [selectedItem.id]: { ...prev[selectedItem.id], ...updated },
            }));
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
  rawDoc: ApiDocument | null;
  onClose: () => void;
  onDelete: () => void;
  onDetailChange: (d: Partial<ItemDetail>) => void;
}

function InboxDetail({ item, detail, rawDoc, onClose, onDelete }: InboxDetailProps) {
  const [period, setPeriod] = useState(detail.period);
  const [reminderDone, setReminderDone] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSetReminder = async () => {
    if (!rawDoc?.due_date) return;
    setReminderLoading(true);
    try {
      await createReminder({ document_id: rawDoc.id, title: item.name, due_at: rawDoc.due_date });
      setReminderDone(true);
    } finally {
      setReminderLoading(false);
    }
  };

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
        <span className="text-[17px] font-bold text-on flex-1 text-center">
          {item.name}
        </span>
        <button onClick={() => setConfirmDelete(true)} className="p-1 ml-2">
          <Icon name="x" size={20} color="rgba(239,68,68,0.7)" />
        </button>
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
          <span className="text-[18px] font-bold" style={{ color: item.urgent ? '#fbbf24' : 'rgba(255,255,255,0.9)' }}>
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

        {/* 주기 */}
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

        {/* 알림 설정 */}
        {rawDoc?.due_date && (
          <button
            onClick={handleSetReminder}
            disabled={reminderDone || reminderLoading}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 border transition-all"
            style={{
              background: reminderDone ? 'rgba(16,185,129,0.1)' : 'rgba(96,165,250,0.08)',
              borderColor: reminderDone ? 'rgba(16,185,129,0.3)' : 'rgba(96,165,250,0.3)',
              color: reminderDone ? '#6ee7b7' : '#60a5fa',
            }}
          >
            <Icon name="bell" size={16} color={reminderDone ? '#6ee7b7' : '#60a5fa'} />
            <span className="text-[14px] font-medium">
              {reminderDone ? '알림 설정 완료' : reminderLoading ? '설정 중...' : '알림 설정하기'}
            </span>
          </button>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-8" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full rounded-2xl p-6 flex flex-col gap-4" style={{ background: '#1a2744' }}>
            <div className="text-[16px] font-bold text-on text-center">문서를 삭제할까요?</div>
            <div className="text-[13px] text-sub text-center">삭제하면 복구할 수 없습니다.</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-xl border border-soft text-[14px] text-sub">취소</button>
              <button onClick={onDelete}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white"
                style={{ background: '#ef4444' }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 닫기 */}
      <div className="px-5 pb-6 pt-3 shrink-0">
        <button onClick={onClose} className="w-full py-4 rounded-2xl bg-blue-main text-white font-semibold text-[15px]">
          확인
        </button>
      </div>
    </div>
  );
}
