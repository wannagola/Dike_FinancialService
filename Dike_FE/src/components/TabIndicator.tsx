import Icon from './Icon';
import type { Tab } from '../types';

interface TabIndicatorProps {
  tabs: Tab[];
  activeIdx: number;
  onSelect: (i: number) => void;
}

export default function TabIndicator({ tabs, activeIdx, onSelect }: TabIndicatorProps) {
  return (
    <div className="flex items-center justify-around px-2 h-[48px] shrink-0 border-b border-soft">
      {tabs.map((tab, i) => {
        const active = i === activeIdx;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(i)}
            className="flex flex-col items-center gap-[2px] flex-1 py-1 transition-opacity"
            style={{ opacity: active ? 1 : 0.45 }}
          >
            <Icon name={tab.icon} size={18} color={active ? '#60a5fa' : 'white'} />
            <span
              className="text-[9px] font-medium leading-none"
              style={{ color: active ? '#60a5fa' : 'rgba(255,255,255,0.65)' }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
