import { useState, useRef } from 'react';
import BigWriteOverlay from '../../components/BigWriteOverlay';
import Icon from '../../components/Icon';

type InputMethod = 'keyboard' | 'voice' | 'handwrite';
type Stage = 'input' | 'confirming' | 'summary' | 'done';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  placeholder?: string;
}

const FIELDS: Field[] = [
  { key: 'title',          label: '제목',            type: 'text',   placeholder: '예) 전기요금 5월' },
  { key: 'date',           label: '일자',            type: 'date' },
  { key: 'counterAccount', label: '거래 계좌 (상대)', type: 'text',   placeholder: '예) 한국전력공사' },
  { key: 'myAccount',      label: '거래 계좌 (내 것)', type: 'text',  placeholder: '예) 신한은행 110-123-456789' },
  { key: 'amount',         label: '금액',            type: 'number', placeholder: '예) 54200' },
  {
    key: 'period', label: '주기', type: 'select',
    options: ['없음', '1주일', '한 달', '분기', '반기', '1년'],
  },
];

const MOCK_VOICE: Record<string, string> = {
  title:          '한국전력 전기요금',
  date:           '2026-05-25',
  counterAccount: '한국전력공사',
  myAccount:      '신한은행 110-123-456789',
  amount:         '54200',
  period:         '한 달',
};

interface DirectInputProps {
  onBack: () => void;
  onDone: () => void;
}

export default function DirectInput({ onBack, onDone }: DirectInputProps) {
  const [fieldIdx, setFieldIdx] = useState(0);
  const [values, setValues]     = useState<Record<string, string>>({});
  const [method, setMethod]     = useState<InputMethod>('keyboard');
  const [draft, setDraft]       = useState('');
  const [stage, setStage]       = useState<Stage>('input');
  const [recording, setRecording] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const voiceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const field = FIELDS[fieldIdx];

  /* 음성 녹음 시작 */
  const startVoice = () => {
    setRecording(true);
    voiceTimer.current = setTimeout(() => {
      setRecording(false);
      setDraft(MOCK_VOICE[field.key] ?? '인식된 값');
    }, 2500);
  };
  const stopVoice = () => {
    clearTimeout(voiceTimer.current);
    setRecording(false);
  };

  /* 확인 단계로 이동 */
  const goConfirm = () => {
    if (!draft) return;
    setValues(v => ({ ...v, [field.key]: draft }));
    setStage('confirming');
  };

  /* 예 — 다음 필드 or 요약 */
  const acceptField = () => {
    if (fieldIdx < FIELDS.length - 1) {
      setFieldIdx(i => i + 1);
      setDraft('');
      setMethod('keyboard');
      setStage('input');
    } else {
      setStage('summary');
    }
  };

  /* 아니오 — 재입력 */
  const retryField = () => {
    setDraft('');
    setStage('input');
  };

  /* 포맷 헬퍼 */
  const formatValue = (key: string, v: string) => {
    if (key === 'amount') return `${Number(v).toLocaleString()}원`;
    if (key === 'date')   return v.replace(/-/g, '년 ').replace(/(\d{2})$/, '$1일').replace('년 0', '년 ').replace(' 0', ' ');
    return v;
  };

  /* --- 확인 단계 --- */
  if (stage === 'confirming') {
    const displayVal = formatValue(field.key, values[field.key] ?? draft);
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <Header label={`${field.label} 확인`} onBack={retryField} backLabel="← 다시" />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-[14px] text-sub text-center">이렇게 입력됐어요</div>
          <div className="glass-elev w-full rounded-2xl p-6 border border-soft text-center">
            <div className="text-[13px] text-mute mb-2">{field.label}</div>
            <div className="text-[24px] font-bold text-on">{displayVal}</div>
          </div>
          <div className="text-[13px] text-sub">맞나요?</div>
        </div>
        <div className="flex gap-3 px-5 pb-6">
          <button
            onClick={retryField}
            className="flex-1 py-4 rounded-2xl border border-soft text-[15px] text-sub"
          >
            아니오, 다시
          </button>
          <button
            onClick={acceptField}
            className="flex-1 py-4 rounded-2xl bg-blue-main text-white font-semibold text-[15px]"
          >
            예, 맞아요
          </button>
        </div>
      </div>
    );
  }

  /* --- 최종 요약 --- */
  if (stage === 'summary') {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <Header label="최종 확인" onBack={() => { setFieldIdx(FIELDS.length - 1); setStage('input'); }} backLabel="← 수정" />
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 flex flex-col gap-3">
          <p className="text-[13px] text-sub text-center mb-1">입력한 내용을 확인해 주세요.</p>
          {FIELDS.map(f => (
            <div key={f.key} className="glass rounded-xl px-4 py-3 border border-soft">
              <div className="text-[11px] text-mute mb-1">{f.label}</div>
              <div className="text-[15px] font-semibold text-on">
                {formatValue(f.key, values[f.key] ?? '—')}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-6">
          <button
            onClick={() => setStage('done')}
            className="w-full py-4 rounded-2xl bg-blue-main text-white font-semibold text-[16px]"
          >
            서류함에 저장하기
          </button>
        </div>
      </div>
    );
  }

  /* --- 저장 완료 --- */
  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 animate-fade-in px-8">
        <div className="w-20 h-20 rounded-full bg-green/20 flex items-center justify-center">
          <Icon name="check" size={36} color="#10b981" />
        </div>
        <div className="text-center">
          <div className="text-[20px] font-bold text-on mb-1">저장 완료!</div>
          <div className="text-[13px] text-sub">서류함에서 확인하세요.</div>
        </div>
        <button
          onClick={onDone}
          className="px-8 py-3 rounded-2xl border border-soft text-[15px] text-sub"
        >
          닫기
        </button>
      </div>
    );
  }

  /* --- 입력 단계 --- */
  const progress = (fieldIdx / FIELDS.length) * 100;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {showCanvas && (
        <BigWriteOverlay
          onClose={() => setShowCanvas(false)}
          onConfirm={(text) => { if (text) setDraft(text); setShowCanvas(false); }}
        />
      )}

      <Header label="직접 입력" onBack={onBack} backLabel="← 뒤로" />

      {/* 진행 바 */}
      <div className="h-[3px] bg-white/08 mx-5 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-bright rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="px-5 pt-2 pb-1 text-[11px] text-mute">
        {fieldIdx + 1} / {FIELDS.length}
      </div>

      {/* 필드 라벨 */}
      <div className="px-5 py-3">
        <div className="text-[22px] font-bold text-on">{field.label}</div>
        {field.type !== 'select' && (
          <div className="text-[12px] text-mute mt-0.5">{field.placeholder}</div>
        )}
      </div>

      {/* 입력 방법 선택 */}
      <div className="flex gap-2 px-5 mb-4">
        {(['keyboard', 'voice', 'handwrite'] as InputMethod[]).map(m => {
          const icons = { keyboard: '⌨️', voice: '🎤', handwrite: '✏️' };
          const labels = { keyboard: '키보드', voice: '음성', handwrite: '손글씨' };
          return (
            <button
              key={m}
              onClick={() => { setMethod(m); setDraft(''); setRecording(false); }}
              className="flex-1 py-2 rounded-xl text-[12px] font-medium border transition-all"
              style={{
                background: method === m ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                borderColor: method === m ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)',
                color: method === m ? '#60a5fa' : 'rgba(255,255,255,0.55)',
              }}
            >
              {icons[m]} {labels[m]}
            </button>
          );
        })}
      </div>

      {/* 입력 영역 */}
      <div className="flex-1 px-5">

        {/* 키보드 */}
        {method === 'keyboard' && (
          <div className="flex flex-col gap-3">
            {field.type === 'select' ? (
              <div className="grid grid-cols-3 gap-2">
                {field.options!.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDraft(opt)}
                    className="py-3 rounded-xl border text-[14px] font-medium transition-all"
                    style={{
                      background: draft === opt ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)',
                      borderColor: draft === opt ? '#3b82f6' : 'rgba(255,255,255,0.12)',
                      color: draft === opt ? '#93c5fd' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={field.type === 'number' ? 'tel' : field.type}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-4 rounded-2xl text-[18px] font-semibold text-on bg-white/[0.07] border border-white/15 outline-none focus:border-blue-bright/60 placeholder:text-white/25"
                autoFocus
              />
            )}
          </div>
        )}

        {/* 음성 */}
        {method === 'voice' && (
          <div className="flex flex-col items-center gap-5 pt-4">
            <button
              className="w-24 h-24 rounded-full flex items-center justify-center transition-all"
              style={{
                background: recording
                  ? 'radial-gradient(circle, #60a5fa, #1d4ed8)'
                  : 'rgba(59,130,246,0.15)',
                boxShadow: recording ? '0 0 0 8px rgba(96,165,250,0.2)' : 'none',
                border: '2px solid rgba(96,165,250,0.4)',
              }}
              onMouseDown={startVoice} onMouseUp={stopVoice}
              onTouchStart={e => { e.preventDefault(); startVoice(); }} onTouchEnd={stopVoice}
            >
              {recording ? (
                <div className="flex items-end gap-[3px]">
                  {[1,2,3,4,3,2,1].map((h, i) => (
                    <div key={i} className="w-[3px] rounded-full bg-white animate-wave"
                      style={{ height: h * 5, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : (
                <Icon name="mic" size={32} color="#60a5fa" />
              )}
            </button>
            <p className="text-[13px] text-sub text-center">
              {recording ? '듣고 있어요 — 손 떼면 인식' : '마이크를 길게 누르세요'}
            </p>
            {draft && (
              <div className="w-full glass rounded-xl px-4 py-3 border border-soft text-center">
                <div className="text-[11px] text-mute mb-1">인식된 내용</div>
                <div className="text-[16px] font-semibold text-on">{draft}</div>
              </div>
            )}
          </div>
        )}

        {/* 손글씨 */}
        {method === 'handwrite' && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              onClick={() => setShowCanvas(true)}
              className="w-full py-6 rounded-2xl border-2 border-dashed border-blue-bright/30 flex flex-col items-center gap-2"
              style={{ background: 'rgba(96,165,250,0.05)' }}
            >
              <Icon name="pen" size={28} color="#60a5fa" />
              <span className="text-[13px] text-sub">탭해서 손글씨 쓰기</span>
            </button>
            {draft && (
              <div className="w-full glass rounded-xl px-4 py-3 border border-soft text-center">
                <div className="text-[11px] text-mute mb-1">인식된 내용</div>
                <div className="text-[16px] font-semibold text-on">{draft}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 확인 버튼 */}
      <div className="px-5 pb-6 pt-4">
        <button
          onClick={goConfirm}
          disabled={!draft}
          className="w-full py-4 rounded-2xl font-semibold text-[16px] transition-all"
          style={{
            background: draft ? '#3b82f6' : 'rgba(255,255,255,0.06)',
            color: draft ? 'white' : 'rgba(255,255,255,0.25)',
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

function Header({ label, onBack, backLabel }: { label: string; onBack: () => void; backLabel: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-soft shrink-0">
      <button onClick={onBack} className="text-[13px] text-sub">{backLabel}</button>
      <span className="text-[16px] font-semibold text-on flex-1 text-center">{label}</span>
      <div className="w-8" />
    </div>
  );
}
