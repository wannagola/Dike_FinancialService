import { useState, useCallback } from 'react';
import Icon from './Icon';

interface PttBarProps {
  onAnnounce: (text: string) => void;
  onWrite: () => void;
}

export default function PttBar({ onAnnounce, onWrite }: PttBarProps) {
  const [recording, setRecording] = useState(false);
  const [recText, setRecText] = useState('');

  const startRec = useCallback(() => {
    setRecording(true);
    setRecText('듣고 있습니다...');
  }, []);

  const stopRec = useCallback(() => {
    setRecording(false);
    setRecText('');
    onAnnounce('음성을 인식했습니다.');
  }, [onAnnounce]);

  return (
    <div
      className="shrink-0 h-[110px] flex flex-col items-center justify-center gap-2 border-t border-soft"
      style={{ background: 'rgba(15,34,68,0.95)', backdropFilter: 'blur(20px)' }}
    >
      {recText && (
        <div className="absolute bottom-[120px] left-4 right-4 glass rounded-xl px-4 py-2 flex items-center gap-2 animate-fade-in">
          {recording && (
            <div className="flex items-end gap-[2px]">
              {[1, 2, 3, 4, 5, 4, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-blue-bright animate-wave"
                  style={{ height: h * 3, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
          <span className="text-[13px] text-on">{recText}</span>
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* 손글씨 버튼 */}
        <button
          onClick={onWrite}
          className="w-12 h-12 rounded-full glass flex items-center justify-center border border-soft"
        >
          <Icon name="pen" size={20} color="rgba(255,255,255,0.7)" />
        </button>

        {/* 메인 마이크 버튼 */}
        <button
          className="relative w-16 h-16 rounded-full flex items-center justify-center select-none touch-none"
          style={{
            background: recording
              ? 'radial-gradient(circle, #3b82f6, #1e3a6e)'
              : 'radial-gradient(circle, #1e3a6e, #0f2244)',
            boxShadow: recording
              ? '0 0 0 4px rgba(96,165,250,0.3), 0 8px 24px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(0,0,0,0.4)',
          }}
          onMouseDown={startRec}
          onMouseUp={stopRec}
          onMouseLeave={() => recording && stopRec()}
          onTouchStart={(e) => { e.preventDefault(); startRec(); }}
          onTouchEnd={stopRec}
        >
          {recording && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-bright/40 animate-pulse-ring" />
          )}
          <Icon name="mic" size={26} color={recording ? 'white' : 'rgba(255,255,255,0.8)'} />
        </button>

        {/* 여백 균형 */}
        <div className="w-12 h-12" />
      </div>

      <span className="text-[11px] text-mute">
        {recording ? '손 떼면 인식' : '마이크를 길게 눌러 말하세요'}
      </span>
    </div>
  );
}
