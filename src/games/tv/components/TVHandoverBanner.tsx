import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyEase, playerGlow } from '@/lib/party-motion';
import type { TvHandover } from '@/games/ui/guest-handover';
import { lu } from './tv-lobby-scale';

/** Prueft `handover` aus dem Spielzustand — oeffentliche Daten, aber trotzdem Leitung. */
export function parseTvHandover(value: unknown): TvHandover | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.playerId !== 'string' || !raw.playerId || typeof raw.name !== 'string' || !raw.name.trim()) return null;
  return {
    playerId: raw.playerId.slice(0, 128),
    name: raw.name.trim().slice(0, 40),
    avatar: typeof raw.avatar === 'string' ? raw.avatar.slice(0, 16) : '',
    color: typeof raw.color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(raw.color) ? raw.color : '#df8eff',
  };
}

/**
 * T07 „Gast ist dran“ — generisch fuer jedes Spiel, das `handover` in seinen
 * TV-Zustand legt. Unten mittig, die Spielerfarbe nur als Schein (nie als
 * Textfarbe); beim Wechsel auf eine neue Person ein Ton (T07-Cue: chime).
 */
export default function TVHandoverBanner({ handover, onCue }: { handover: TvHandover | null; onCue?: () => void }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const lastIdRef = useRef<string | null>(null);
  const cueRef = useRef(onCue);
  cueRef.current = onCue;

  useEffect(() => {
    const id = handover?.playerId ?? null;
    if (id && id !== lastIdRef.current) cueRef.current?.();
    lastIdRef.current = id;
  }, [handover?.playerId]);

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style={{ insetBlockEnd: '5vh', paddingInline: '5vw' }}>
      <AnimatePresence mode="wait">
        {handover && (
          <motion.div
            key={handover.playerId}
            data-testid="tv-handover"
            data-player-id={handover.playerId}
            role="status"
            aria-live="polite"
            className="flex min-w-0 items-center rounded-full border border-white/10 bg-[#0d0915]/92 font-black text-white"
            style={{ gap: lu(1.4), paddingBlock: lu(1), paddingInlineStart: lu(1.1), paddingInlineEnd: lu(2.8), fontSize: lu(2.8), boxShadow: `${playerGlow(handover.color, 'active')}, 0 24px 70px -20px rgba(0,0,0,0.85)` }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, transition: { duration: 0.26, ease: partyEase.exit } }}
            transition={{ duration: 0.5, ease: partyEase.out }}
          >
            <span
              className="grid shrink-0 place-items-center rounded-full leading-none"
              style={{ width: lu(5.6), height: lu(5.6), fontSize: lu(3.4), background: `radial-gradient(circle at 35% 30%, ${handover.color}66, ${handover.color}24 70%)` }}
              aria-hidden
            >
              {handover.avatar}
            </span>
            <span className="min-w-0 truncate">
              {t('partyPlay.tv.handover', '{{name}} spielt am Host-Handy …', { name: handover.name })}
            </span>
            <Repeat2 aria-hidden strokeWidth={2.5} className="shrink-0 text-[#df8eff]" style={{ width: lu(3), height: lu(3) }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
