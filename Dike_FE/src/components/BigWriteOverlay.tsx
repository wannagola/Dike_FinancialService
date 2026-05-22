import { useRef, useEffect, useCallback } from 'react';
import Icon from './Icon';

interface BigWriteOverlayProps {
  onClose: () => void;
  onConfirm: (text: string) => void;
}

export default function BigWriteOverlay({ onClose, onConfirm }: BigWriteOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 격자 배경
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.offsetWidth; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.offsetHeight); ctx.stroke();
    }
    for (let y = 0; y < canvas.offsetHeight; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.offsetWidth, y); ctx.stroke();
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const stopDraw = useCallback(() => { drawing.current = false; }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.offsetWidth; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.offsetHeight); ctx.stroke();
    }
    for (let y = 0; y < canvas.offsetHeight; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.offsetWidth, y); ctx.stroke();
    }
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-navy flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
        <button onClick={onClose} className="p-2 rounded-xl glass">
          <Icon name="arrow-left" size={20} color="white" />
        </button>
        <span className="text-[16px] font-semibold text-on">크게 써주세요</span>
        <button
          onClick={clear}
          className="px-4 py-2 rounded-xl glass text-[13px] text-sub"
        >
          지우기
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 w-full touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={(e) => { e.preventDefault(); startDraw(e); }}
        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
        onTouchEnd={stopDraw}
      />

      <div className="p-5">
        <button
          onClick={() => { onConfirm(''); onClose(); }}
          className="w-full py-4 rounded-2xl bg-blue-main text-white font-semibold text-[16px]"
        >
          확인
        </button>
      </div>
    </div>
  );
}
