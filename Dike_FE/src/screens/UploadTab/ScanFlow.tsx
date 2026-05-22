import { useEffect, useState } from 'react';

interface ScanFlowProps {
  onDone: () => void;
  onBack: () => void;
}

const MSGS = [
  '카메라를 문서에 맞추세요',
  '문서를 인식하고 있습니다...',
  'AI가 내용을 분석 중입니다...',
  '인식 완료!',
];

export default function ScanFlow({ onDone, onBack }: ScanFlowProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timings = [800, 2000, 3200, 4400];
    const timeouts = timings.map((t, i) =>
      setTimeout(() => {
        setMsgIdx(i);
        if (i === 3) setDone(true);
      }, t)
    );
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const borderColor = msgIdx === 0 ? 'rgba(255,255,255,0.5)'
    : msgIdx === 1 ? '#fbbf24'
    : msgIdx >= 2 ? '#10b981' : 'white';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-soft">
        <button onClick={onBack} className="text-[13px] text-sub">← 뒤로</button>
        <span className="text-[16px] font-semibold text-on flex-1 text-center">카메라 스캔</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {/* 스캔 프레임 */}
        <div
          className="w-full aspect-[3/4] rounded-2xl border-2 flex items-center justify-center relative"
          style={{
            borderColor,
            background: 'rgba(255,255,255,0.04)',
            transition: 'border-color 0.5s',
          }}
        >
          {/* 코너 마커 */}
          {[['top-2 left-2', 'border-t-2 border-l-2'],
            ['top-2 right-2', 'border-t-2 border-r-2'],
            ['bottom-2 left-2', 'border-b-2 border-l-2'],
            ['bottom-2 right-2', 'border-b-2 border-r-2'],
          ].map(([pos, border], i) => (
            <div
              key={i}
              className={`absolute w-6 h-6 ${pos} ${border}`}
              style={{ borderColor }}
            />
          ))}

          {done && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span className="text-[14px] text-on">인식 완료</span>
            </div>
          )}
        </div>

        {/* 상태 메시지 */}
        <div className="text-[15px] font-medium text-on text-center">{MSGS[msgIdx]}</div>

        {/* 진행 바 */}
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-bright transition-all duration-700"
            style={{ width: `${(msgIdx / 3) * 100}%` }}
          />
        </div>
      </div>

      {done && (
        <div className="px-5 pb-6">
          <button
            onClick={onDone}
            className="w-full py-4 rounded-2xl bg-blue-main text-white font-semibold text-[16px]"
          >
            내용 확인하기
          </button>
        </div>
      )}
    </div>
  );
}
