import { useRef, useCallback } from 'react';

export function useSwipe(
  idx: number,
  setIdx: (i: number) => void,
  maxIdx: number,
  onSwipe?: (dir: 'left' | 'right') => void,
) {
  const startX = useRef<number | null>(null);

  const onStart = useCallback((x: number) => {
    startX.current = x;
  }, []);

  const onEnd = useCallback((x: number) => {
    if (startX.current === null) return;
    const delta = x - startX.current;
    startX.current = null;
    if (Math.abs(delta) < 60) return;

    if (delta < 0 && idx < maxIdx) {
      setIdx(idx + 1);
      onSwipe?.('left');
    } else if (delta > 0 && idx > 0) {
      setIdx(idx - 1);
      onSwipe?.('right');
    }
  }, [idx, setIdx, maxIdx, onSwipe]);

  const dragHandlers = {
    onMouseDown: (e: React.MouseEvent) => onStart(e.clientX),
    onMouseUp: (e: React.MouseEvent) => onEnd(e.clientX),
    onTouchStart: (e: React.TouchEvent) => onStart(e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => onEnd(e.changedTouches[0].clientX),
  };

  return { dragHandlers };
}
