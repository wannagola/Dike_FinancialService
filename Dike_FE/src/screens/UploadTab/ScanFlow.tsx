import { useRef, useState } from 'react';
import { ocrPreview } from '../../api';
import type { OcrResult } from '../../types';

interface ScanFlowProps {
  onDone: (result: OcrResult) => void;
  onBack: () => void;
  mode: 'camera' | 'gallery';
}

export default function ScanFlow({ onDone, onBack, mode }: ScanFlowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [msgIdx, setMsgIdx] = useState(0);

  const MSGS = [
    mode === 'camera' ? '카메라로 문서를 촬영하세요' : '갤러리에서 사진을 선택하세요',
    '문서를 인식하고 있습니다...',
    'AI가 내용을 분석 중입니다...',
    '인식 완료!',
  ];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setMsgIdx(1);
    try {
      setTimeout(() => setMsgIdx(2), 1000);
      const result = await ocrPreview(file);
      setMsgIdx(3);
      setStatus('done');
      setTimeout(() => onDone(result), 600);
    } catch {
      setStatus('error');
    }
  };

  const done = status === 'done';

  const borderColor = msgIdx === 0 ? 'rgba(255,255,255,0.5)'
    : msgIdx === 1 ? '#fbbf24'
    : msgIdx >= 2 ? '#10b981' : 'white';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-soft">
        <button onClick={onBack} className="text-[13px] text-sub">← 뒤로</button>
        <span className="text-[16px] font-semibold text-on flex-1 text-center">{mode === 'camera' ? '카메라 스캔' : '사진 업로드'}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        {...(mode === 'camera' ? { capture: 'environment' } : {})}
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        {/* 스캔 프레임 */}
        <button
          className="w-full aspect-[3/4] rounded-2xl border-2 flex items-center justify-center relative"
          style={{
            borderColor,
            background: 'rgba(255,255,255,0.04)',
            transition: 'border-color 0.5s',
          }}
          onClick={() => status === 'idle' && inputRef.current?.click()}
          disabled={status === 'uploading'}
        >
          {[['top-2 left-2', 'border-t-2 border-l-2'],
            ['top-2 right-2', 'border-t-2 border-r-2'],
            ['bottom-2 left-2', 'border-b-2 border-l-2'],
            ['bottom-2 right-2', 'border-b-2 border-r-2'],
          ].map(([pos, border], i) => (
            <div key={i} className={`absolute w-6 h-6 ${pos} ${border}`} style={{ borderColor }} />
          ))}

          {status === 'idle' && (
            <div className="flex flex-col items-center gap-2 text-sub">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="text-[13px]">{mode === 'camera' ? '탭해서 촬영하세요' : '탭해서 사진을 선택하세요'}</span>
            </div>
          )}
          {status === 'uploading' && (
            <div className="text-[14px] text-sub animate-pulse">분석 중...</div>
          )}
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
          {status === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[14px]" style={{ color: '#ef4444' }}>인식 실패. 다시 시도하세요.</span>
            </div>
          )}
        </button>

        <div className="text-[15px] font-medium text-on text-center">{MSGS[msgIdx]}</div>

        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-bright transition-all duration-700"
            style={{ width: `${(msgIdx / 3) * 100}%` }}
          />
        </div>
      </div>

      {status === 'error' && (
        <div className="px-5 pb-6">
          <button
            onClick={() => { setStatus('idle'); setMsgIdx(0); }}
            className="w-full py-4 rounded-2xl border border-soft text-[15px] text-sub"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
