import type { ConnectionStatus as CS } from '@/types/emotion';

interface ConnectionStatusProps {
  status: CS;
  label?: string;
}

const config: Record<CS, { dot: string; label: string; pulse?: boolean }> = {
  idle:          { dot: 'bg-muted-foreground', label: 'Disconnected' },
  connecting:    { dot: 'bg-amber-400', label: 'Connecting', pulse: true },
  connected:     { dot: 'bg-emerald-400', label: 'Connected' },
  disconnecting: { dot: 'bg-amber-400', label: 'Finishing' },
  error:         { dot: 'bg-destructive', label: 'Error' },
};

export default function ConnectionStatusBadge({ status, label }: ConnectionStatusProps) {
  const c = config[status];
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium surface-2 hairline text-foreground/80">
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      <span>{c.label}</span>
      {label && <span className="font-mono text-muted-foreground">{label}</span>}
    </span>
  );
}
