import { BACKENDS, type BackendId } from '@/types/emotion';
import { Check } from 'lucide-react';

interface BackendSelectorProps {
  selected: BackendId;
  onChange: (id: BackendId) => void;
  disabled?: boolean;
}

export default function BackendSelector({ selected, onChange, disabled }: BackendSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {(Object.keys(BACKENDS) as BackendId[]).map((id) => {
        const b = BACKENDS[id];
        const isActive = selected === id;
        return (
          <button
            key={id}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`relative flex-1 rounded-2xl p-5 text-left transition-all duration-200 hairline overflow-hidden ${
              isActive ? 'surface-2' : 'surface-1 hover:surface-2'
            } disabled:opacity-50 disabled:cursor-not-allowed group`}
            style={isActive ? {
              boxShadow: `inset 0 0 0 1px ${b.color}80, 0 0 24px ${b.color}25`,
            } : undefined}
          >
            {isActive && (
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ backgroundColor: b.color }}
              />
            )}
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: b.color, boxShadow: `0 0 8px ${b.color}` }}
                  />
                  <span className="font-serif text-lg text-foreground">{b.label}</span>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{b.description}</div>
                <div className="text-[10px] mt-2 font-mono uppercase tracking-widest" style={{ color: b.color }}>
                  Port {b.port}
                </div>
              </div>
              {isActive && (
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: b.color }}
                >
                  <Check className="w-3 h-3 text-background" strokeWidth={3} />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
