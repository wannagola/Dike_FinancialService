interface VoiceToastProps {
  text: string;
  visible: boolean;
}

export default function VoiceToast({ text, visible }: VoiceToastProps) {
  if (!visible) return null;

  return (
    <div className="absolute top-[90px] left-4 right-4 z-50 animate-fade-in">
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border border-blue-bright/20">
        <div className="flex items-center gap-[3px] shrink-0">
          {[1, 2, 3, 4, 5, 4, 3].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-blue-bright animate-wave"
              style={{
                height: h * 4,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <span className="text-[14px] text-on leading-snug">{text}</span>
      </div>
    </div>
  );
}
