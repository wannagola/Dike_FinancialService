interface NumPadProps {
  value: string;
  onChange: (v: string) => void;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function NumPad({ value, onChange }: NumPadProps) {
  const press = (k: string) => {
    if (k === '⌫') {
      onChange(value.slice(0, -1));
    } else if (k !== '') {
      if (value.length >= 9) return;
      onChange(value + k);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((k, i) => (
        <button
          key={i}
          onClick={() => press(k)}
          disabled={k === ''}
          className="h-14 rounded-2xl flex items-center justify-center text-[22px] font-semibold transition-all active:scale-95"
          style={{
            background: k === '' ? 'transparent' : k === '⌫' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
            color: k === '⌫' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
