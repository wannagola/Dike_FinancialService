import { useState, useRef, useCallback } from 'react';
import type { VoiceState } from '../types';

export function useAnnounce() {
  const [voiceState, setVoiceState] = useState<VoiceState>({ text: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback((text: string) => {
    clearTimeout(timerRef.current);
    setVoiceState({ text, visible: true });
    timerRef.current = setTimeout(() => {
      setVoiceState(s => ({ ...s, visible: false }));
    }, 2500);
  }, []);

  return { voiceState, announce };
}
