import { useState, useRef, useCallback } from 'react';

interface HoldButtonProps {
  label: string;
  sublabel?: string;
  onConfirm: () => void;
}

export default function HoldButton({ label, sublabel, onConfirm }: HoldButtonProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const HOLD_MS = 1500;

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min((elapsed / HOLD_MS) * 100, 100);
    setProgress(pct);
    if (pct < 100) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setHolding(false);
      setProgress(0);
      onConfirm();
    }
  }, [onConfirm]);

  const start = useCallback(() => {
    startRef.current = Date.now();
    setHolding(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setHolding(false);
    setProgress(0);
  }, []);

  return (
    <button
      className="relative w-full rounded-2xl overflow-hidden py-5 border border-soft select-none touch-none"
      style={{ background: holding ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)' }}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={(e) => { e.preventDefault(); start(); }}
      onTouchEnd={stop}
    >
      {progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-blue-bright/20 transition-none"
          style={{ width: `${progress}%` }}
        />
      )}
      <div className="relative flex flex-col items-center gap-1">
        <span className="text-[15px] font-semibold text-on">{label}</span>
        {sublabel && <span className="text-[12px] text-sub">{sublabel}</span>}
        <span className="text-[11px] text-mute mt-1">
          {holding ? `${Math.round(progress)}%` : '길게 눌러 확인'}
        </span>
      </div>
    </button>
  );
}
