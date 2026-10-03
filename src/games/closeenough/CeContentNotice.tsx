// NAH DRAN — Hinweis ueber dem Startknopf, warum (noch) nicht gestartet werden
// kann: laden, Fehler mit „Erneut versuchen“, leere Auswahl. Nie ein stummer
// grauer Knopf (closeenough-content.ts ceContentState).
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RotateCw, SearchX, WifiOff } from 'lucide-react';
import { partyMotion, pressable } from '@/lib/party-motion';
import type { CeContentState } from './closeenough-content';
import { CE } from './ce-theme';

export function CeContentNotice({ state, onRetry, onAllCategories }: {
  state: CeContentState;
  onRetry?: () => void;
  onAllCategories: () => void;
}) {
  const { t } = useTranslation();
  const reduce = !!useReducedMotion();
  const card = 'mt-6 rounded-[20px] p-4 text-start';
  const surface = { background: CE.surface, border: '1px solid rgba(255,255,255,0.08)' };

  const body = (() => {
    if (state === 'loading') {
      return (
        <div role="status" aria-live="polite" data-testid="ce-content-loading" className={card} style={surface}>
          <span className="sr-only">{t('games.closeenough.loading')}</span>
          <div aria-hidden className="space-y-2">
            {[72, 48].map((w) => (
              <motion.div key={w} className="h-3.5 rounded-full" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.10)' }}
                animate={reduce ? undefined : { opacity: [0.45, 0.9, 0.45] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
            ))}
          </div>
        </div>
      );
    }
    if (state === 'error') {
      return (
        <div role="alert" data-testid="ce-content-error" className={card} style={surface}>
          <p className="flex items-center gap-2 text-base font-bold text-white">
            <WifiOff className="h-5 w-5 shrink-0" style={{ color: CE.bad }} aria-hidden />
            {t('games.closeenough.loadFailedTitle', 'Fragen konnten nicht geladen werden')}
          </p>
          <p className="mt-1 text-[13px] text-white/70">{t('games.closeenough.loadFailedHint', 'Prüfe die Verbindung und versuch es noch einmal.')}</p>
          {onRetry && (
            <motion.button type="button" onClick={onRetry} {...pressable} data-testid="ce-content-retry"
              className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 font-bold" style={{ background: CE.accent, color: CE.bg }}>
              <RotateCw className="h-4 w-4" aria-hidden />{t('games.closeenough.retryLoad', 'Erneut versuchen')}
            </motion.button>
          )}
        </div>
      );
    }
    if (state === 'emptySelection') {
      return (
        <div role="status" data-testid="ce-content-empty-selection" className={card} style={surface}>
          <p className="flex items-center gap-2 text-base font-bold text-white">
            <SearchX className="h-5 w-5 shrink-0" style={{ color: CE.accent }} aria-hidden />
            {t('games.closeenough.emptySelectionTitle', 'Keine Fragen für diese Auswahl')}
          </p>
          <p className="mt-1 text-[13px] text-white/70">{t('games.closeenough.emptySelectionHint', 'Wähle andere Kategorien oder spiel den Mix.')}</p>
          <motion.button type="button" onClick={onAllCategories} {...pressable}
            className="mt-3 inline-flex min-h-12 items-center rounded-2xl px-5 font-bold text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {t('games.closeenough.useMix', 'Mix spielen')}
          </motion.button>
        </div>
      );
    }
    if (state === 'empty') {
      return (
        <div role="status" data-testid="ce-content-empty" className={card} style={surface}>
          <p className="text-[13px] text-white/70">{t('games.closeenough.noQuestionsSetup')}</p>
        </div>
      );
    }
    return null;
  })();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {body && <motion.div key={state} variants={partyMotion('cardEnter', reduce)} initial="initial" animate="animate" exit="exit">{body}</motion.div>}
    </AnimatePresence>
  );
}
