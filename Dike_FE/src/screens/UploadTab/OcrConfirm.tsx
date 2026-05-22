interface OcrConfirmProps {
  onBack: () => void;
  onDone: () => void;
}

const FIELDS = [
  { label: '납부처', value: '한국전력공사', confidence: 99 },
  { label: '금액',   value: '54,200원',    confidence: 98 },
  { label: '기한',   value: '2026.05.25', confidence: 95 },
  { label: '주기',   value: '매월',        confidence: 97 },
];

export default function OcrConfirm({ onBack, onDone }: OcrConfirmProps) {
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
          <span className="ml-auto text-[14px] font-bold text-on">98%</span>
        </div>

        {/* 필드 목록 */}
        <div className="flex flex-col gap-3">
          {FIELDS.map((f) => (
            <div key={f.label} className="glass rounded-xl px-4 py-3 border border-soft">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-mute">{f.label}</span>
                <span className="text-[11px]" style={{ color: f.confidence >= 97 ? '#10b981' : '#fbbf24' }}>
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
          onClick={onDone}
          className="flex-1 py-4 rounded-2xl bg-blue-main text-white font-semibold text-[16px]"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
