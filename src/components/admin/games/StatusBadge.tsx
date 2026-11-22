import { useTranslation } from 'react-i18next';
import { Database, Lock, PencilRuler } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStatus } from './game-registry';

const TONE: Record<GameStatus, string> = {
  live: 'border-primary/40 bg-primary/10 text-primary',
  editor: 'border-border bg-secondary text-secondary-foreground',
  static: 'border-border bg-muted text-muted-foreground',
};

const ICON = { live: Database, editor: PencilRuler, static: Lock } as const;

export function StatusBadge({ status, className }: { status: GameStatus; className?: string }) {
  const { t } = useTranslation();
  const label = {
    live: t('admin.games.status.live', 'Live bearbeitbar'),
    editor: t('admin.games.status.editor', 'Eigener Editor'),
    static: t('admin.games.status.static', 'Fest in der App'),
  }[status];
  const Icon = ICON[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        TONE[status],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
