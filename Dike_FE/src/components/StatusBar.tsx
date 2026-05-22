import { useState, useEffect } from 'react';

export default function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-5 h-[50px] shrink-0">
      <span className="text-[15px] font-semibold text-on">{time}</span>
      <div className="flex items-center gap-1.5">
        {/* 신호 바 */}
        <div className="flex items-end gap-[2px]">
          {[3, 5, 7, 9].map((h, i) => (
            <div key={i} className="w-[3px] rounded-sm bg-white/80" style={{ height: h }} />
          ))}
        </div>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 24 18" fill="none">
          <path d="M1 6.5C5.5 2 10.5 0 12 0s6.5 2 11 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.4"/>
          <path d="M4.5 10C7.5 7 10 6 12 6s4.5 1 7.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.7"/>
          <path d="M8 13.5C9.5 12 11 11 12 11s2.5 1 4 2.5" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="12" cy="17" r="1.5" fill="white"/>
        </svg>
        {/* 배터리 */}
        <div className="flex items-center gap-[1px]">
          <div className="w-[22px] h-[11px] rounded-[2px] border border-white/80 p-[1.5px] flex">
            <div className="w-3/4 h-full rounded-[1px] bg-white/90" />
          </div>
          <div className="w-[2px] h-[5px] rounded-r-sm bg-white/60" />
        </div>
      </div>
    </div>
  );
}
