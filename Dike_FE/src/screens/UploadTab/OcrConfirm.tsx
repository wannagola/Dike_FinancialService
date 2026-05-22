import { useState } from 'react';
import { createDocument } from '../../api';
import type { OcrResult } from '../../types';

const CATEGORY_OPTIONS: { code: string; label: string }[] = [
  { code: 'CAT_01', label: '고지서 / 공과금' },
  { code: 'CAT_04', label: '정기지출' },
  { code: 'CAT_02', label: '송장 / 세금계산서' },
  { code: 'CAT_07', label: '의료비' },
  { code: 'CAT_99', label: '기타' },
];

interface OcrConfirmProps {
  result: OcrResult;
  onBack: () => void;
  onDone: () => void;
}

export default function OcrConfirm({ result, onBack, onDone }: OcrConfirmProps) {
  const [saving, setSaving] = useState(false);
  const [categoryCode, setCategoryCode] = useState(result.parsed.category_code ?? 'CAT_99');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const p = result.parsed;
  const confidence = Math.round(result.confidence_score * 100);
  const selectedCat = CATEGORY_OPTIONS.find(c => c.code === categoryCode);
  const fields = [
    { label: '제목',   value: p.title || '—',                    confidence },
    { label: '납부처', value: p.partner_name || '—',              confidence },
    { label: '금액',   value: p.amount != null ? `${p.amount.toLocaleString()}원` : '—', confidence },
    { label: '기한',   value: p.due_date ? p.due_date.slice(0, 10) : '—', confidence },
  ];

  const save = async () => {
    setSaving(true);
    try {
      await createDocument({
        title: p.title,
        category_code: categoryCode,
        amount: p.amount ?? undefined,
        due_date: p.due_date ?? undefined,
        partner_name: p.partner_name ?? undefined,
      });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-soft">
        <button onClick={onBack} className="text-[13px] text-sub">← 뒤로</button>
        <span className="text-[16px] font-semibold text-on flex-1 text-center">내용 확인</span>
      </div>

      <div className="flex-1 flex flex-col gap-4 px-5 py-4 overflow-y-auto scrollbar-none">
        {/* 신뢰도 */}
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 border border-soft">
          <div className="w-2 h-2 rounded-full bg-green" />
          <span className="text-[13px] text-sub">AI 인식 신뢰도</span>
          <span className="ml-auto text-[14px] font-bold text-on">{confidence}%</span>
        </div>

        {/* 카테고리 선택 */}
        <button
          onClick={() => setShowCatPicker(v => !v)}
          className="w-full px-4 py-3 rounded-xl border text-left transition-all"
          style={{ background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.3)' }}
        >
          <div className="text-[11px] text-mute mb-1">서류 종류 (탭하면 변경)</div>
          <div className="text-[15px] font-semibold" style={{ color: '#60a5fa' }}>
            {selectedCat?.label ?? '기타'}
          </div>
        </button>
        {showCatPicker && (
          <div className="flex flex-col gap-2">
            {CATEGORY_OPTIONS.map(opt => (
              <button
                key={opt.code}
                onClick={() => { setCategoryCode(opt.code); setShowCatPicker(false); }}
                className="w-full px-4 py-3 rounded-xl border text-left text-[14px] font-medium transition-all"
                style={{
                  background: categoryCode === opt.code ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  borderColor: categoryCode === opt.code ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: categoryCode === opt.code ? '#93c5fd' : 'rgba(255,255,255,0.8)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* 필드 목록 */}
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <div key={f.label} className="glass rounded-xl px-4 py-3 border border-soft">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-mute">{f.label}</span>
                <span className="text-[11px]" style={{ color: f.confidence >= 80 ? '#10b981' : '#fbbf24' }}>
                  {f.confidence}%
                </span>
              </div>
              <div className="text-[16px] font-semibold text-on">{f.value}</div>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-mute text-center leading-relaxed">
          내용이 맞으면 저장 버튼을 눌러주세요.<br />수정하려면 항목을 탭하세요.
        </p>
      </div>

      <div className="px-5 pb-6 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border border-soft text-[15px] text-sub"
        >
          다시 촬영
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-4 rounded-2xl bg-blue-main text-white font-semibold text-[16px] transition-opacity"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
