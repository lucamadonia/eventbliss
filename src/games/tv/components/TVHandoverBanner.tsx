import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Repeat2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { partyEase, playerGlow } from '@/lib/party-motion';
import type { TvHandover } from '@/games/ui/guest-handover';
import { lu } from './tv-lobby-scale';
import { avatarFor, useTVRoster } from '../cinema/tv-roster';

// Pruefung der Leitung lebt in cinema/tv-handover (rein, getestet).
export { parseTvHandover } from '../cinema/tv-handover';

/**
 * T07 „Gast ist dran“ — generisch fuer jedes Spiel, das `handover` in seinen
 * TV-Zustand legt. Unten mittig, die Spielerfarbe nur als Schein (nie als
 * Textfarbe); beim Wechsel auf eine neue Person ein Ton (T07-Cue: chime).
 */
export default function TVHandoverBanner({ handover, onCue }: { handover: TvHandover | null; onCue?: () => void }) {
  const { t } = useTranslation();
  const roster = useTVRoster();
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
    // Oben mittig: unten liegen Ranglisten-Leisten und der Nachzuegler-QR.
    <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center" style={{ insetBlockStart: '5vh', paddingInline: '22vw' }}>
      <AnimatePresence mode="wait">
        {handover && (
          <motion.div
            key={handover.playerId}
            data-testid="tv-handover"
            data-player-id={handover.playerId}
            role="status"
            aria-live="polite"
            className="relative flex min-w-0 items-center overflow-hidden rounded-full border border-white/10 bg-[#0d0915]/92 font-black text-white"
            style={{ gap: lu(1.6), paddingBlock: lu(1), paddingInlineStart: lu(1.1), paddingInlineEnd: lu(3), fontSize: lu(2.8), boxShadow: `${playerGlow(handover.color, 'active')}, 0 24px 70px -20px rgba(0,0,0,0.85)` }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16, transition: { duration: 0.26, ease: partyEase.exit } }}
            transition={{ duration: 0.5, ease: partyEase.out }}
          >
            {/* Lichtkante beim Auftritt — einmal, nur transform. */}
            {!reduced && (
              <motion.span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3"
                style={{ background: `linear-gradient(90deg, transparent, ${handover.color}33, transparent)` }}
                initial={{ x: '-120%' }} animate={{ x: '420%' }} transition={{ duration: 1.2, ease: partyEase.inOut, delay: 0.15 }} />
            )}
            <span className="relative grid shrink-0 place-items-center" style={{ width: lu(6.4), height: lu(6.4) }} aria-hidden>
              {/* Wartering: dreht sich, bis die Person „Ich bin …“ bestaetigt hat. */}
              <motion.span className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, ${handover.color}, transparent 35%, transparent 65%, ${handover.color})`,
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
                }}
                animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
              <span className="grid place-items-center rounded-full leading-none"
                style={{ width: lu(5.4), height: lu(5.4), fontSize: lu(3.3), background: `radial-gradient(circle at 35% 30%, ${handover.color}66, ${handover.color}24 70%)` }}>
                {avatarFor(roster, { id: handover.playerId, name: handover.name, avatar: handover.avatar })}
              </span>
            </span>
            <span className="relative flex min-w-0 flex-col">
              <span className="min-w-0 truncate leading-tight">
                {t('partyPlay.tv.handover', '{{name}} spielt am Host-Handy …', { name: handover.name })}
              </span>
              {handover.next && (
                <span data-testid="tv-handover-next" className="truncate font-semibold text-white/60" style={{ fontSize: lu(2) }}>
                  {t('partyPlay.tv.nextUp', 'Als Nächstes: {{name}}', { name: handover.next.name })}
                </span>
              )}
            </span>
            <Repeat2 aria-hidden strokeWidth={2.5} className="shrink-0 text-[#df8eff]" style={{ width: lu(3), height: lu(3) }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
