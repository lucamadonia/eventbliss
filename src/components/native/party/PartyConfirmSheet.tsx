import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PartySheet } from './PartySheet';

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  /** QA selectors: sheet root and confirm button. */
  testId: string;
  confirmTestId: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Leave / end / switch party: one decision, the safe choice first. */
export function PartyConfirmSheet({ open, title, body, confirmLabel, danger, busy, testId, confirmTestId, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <PartySheet open={open} onClose={onClose} title={title} subtitle={body} testId={testId}
      footer={<div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="min-h-14 rounded-2xl bg-white/[.06] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:bg-white/10">
          {t('partyPlay.stay', 'Bleiben')}
        </button>
        <button type="button" data-testid={confirmTestId} disabled={busy} onClick={onConfirm}
          className={cn('min-h-14 rounded-2xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] active:scale-[.98] disabled:opacity-40',
            danger ? 'bg-[#ff6b98] text-[#0b0b12]' : 'bg-white/[.1] text-white')}>
          {confirmLabel}
        </button>
      </div>}>
      <span className="sr-only">{body}</span>
    </PartySheet>
  );
}
