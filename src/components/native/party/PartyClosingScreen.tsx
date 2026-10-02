import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Crown, PartyPopper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NativeOverlayPortal } from '@/components/native/NativeOverlayPortal';
import { ConfettiBurst } from '@/components/vfx/ConfettiBurst';
import { clearPartyScene, usePartyScene } from '@/games/party/party-scene';
import { sceneLocalTime } from '@/games/party/scene-schedule';
import type { PartyStanding } from '@/games/tv/party-types';
import { confettiBurst, listStagger, partyMotion, playerGlow, pressable } from '@/lib/party-motion';
import { cn } from '@/lib/utils';
import { SeatAvatar } from './PartySheet';
import { PartyRecapCard } from './PartyRecapCard';
import { buildPartyRecap } from '@/games/party/party-recap';
import type { GameHistoryEntry } from '@/games/party/session-schema';
import { PartyBottomBar, PartyBottomBarSpacer } from './PartyBottomBar';
import { usePartyScreenTrace } from './ui-trace';

interface Props {
  standings: PartyStanding[];
  /** This device's player, for the own placement. */
  myPlayerId: string | null;
  /** The evening's games, for the "Abend-Rückblick". */
  history: GameHistoryEntry[];
  partyDateMs: number;
  onStartOwn: () => void;
  onDone: () => void;
}

const MEDAL = ['#fbbf24', '#cbd5e1', '#d6925c'] as const;
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8ff5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060810]';

/** Podium order on screen: 2nd · 1st · 3rd (the winner in the middle, highest). */
export function podiumOrder<T>(top: readonly T[]): T[] {
  return [top[1], top[0], top[2]].filter((x): x is T => x !== undefined);
}

/**
 * D04/T16 — the biggest moment of the evening. Own placement as the hero
 * (the winner with a crown), the podium for the top three, the rest below,
 * a result to share, and confetti in sync with the TV podium.
 */
export function PartyClosingScreen({ standings, myPlayerId, history, partyDateMs, onStartOwn, onDone }: Props) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  usePartyScreenTrace('ended');
  const mine = standings.find(row => row.id === myPlayerId);
  const top = standings.filter(row => row.rank <= 3).slice(0, 3);
  const rest = standings.filter(row => !top.includes(row));
  const scene = usePartyScene();
  const [confetti, setConfetti] = useState(false);
  // T16: confetti on every phone at the same moment as the TV podium (finale
  // scene start + drumroll). Late arrivals without the scene still get one burst.
  useEffect(() => {
    if (reduced) return;
    const finale = scene?.scene === 'finale' ? scene : null;
    const wait = finale ? Math.max(0, sceneLocalTime(finale.startsAt + confettiBurst.afterDrumrollMs) - Date.now()) : 300;
    const start = setTimeout(() => setConfetti(true), wait);
    const stop = setTimeout(() => { setConfetti(false); if (finale) clearPartyScene(finale.sceneId); }, wait + confettiBurst.durationMs);
    return () => { clearTimeout(start); clearTimeout(stop); };
  }, [scene?.sceneId, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always open on headline + podium, even if the lobby was scrolled before (same scroll container).
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    sectionRef.current?.closest('main')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);
  const recap = useMemo(() => buildPartyRecap(standings, history, partyDateMs), [standings, history, partyDateMs]);

  return (<>
    {/* Portal: a transformed page wrapper would otherwise trap the fixed confetti layer. */}
    <NativeOverlayPortal><ConfettiBurst active={confetti} count={confettiBurst.particles.phone} /></NativeOverlayPortal>
    <motion.section ref={sectionRef} data-testid="party-ended-screen" role="status" aria-labelledby="closing-title" className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md flex-col"
      variants={partyMotion('cardEnter', reduced)} initial="initial" animate="animate">
      {/* Headline: the own result in words; the podium below is the hero (no duplicate avatar). */}
      {/* Glow: a pure radial on a full-screen layer — no box edge anywhere. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: `radial-gradient(70% 45% at 50% 30%, ${(mine?.color ?? '#df8eff')}2e, transparent 75%)` }} />
      {/* Headline + podium are centred in the space above the thumb-zone CTAs. */}
      <div className="flex flex-1 flex-col justify-center">
      <div className="relative px-5 pb-2 pt-4 text-center">
        <p className="relative text-lg font-bold text-white/80" id="closing-title">{t('partyPlay.closing.title', 'Die Party ist vorbei')}</p>
        {mine && (
          <p data-testid="closing-placement" data-rank={mine.rank} className="relative mt-2 font-game text-3xl font-black text-white">
            {mine.rank === 1 ? t('partyPlay.closing.winner', 'Du hast den Abend gewonnen!') : t('partyPlay.closing.rankLine', 'Platz {{rank}} – {{points}} Punkte', { rank: mine.rank, points: mine.points })}
          </p>
        )}
      </div>

      {/* Podium 2 · 1 · 3 — the hero of the screen; names always white, "Du" marks yourself. */}
      {top.length > 0 && (
        <motion.ol data-testid="closing-podium" className="mx-auto mt-8 grid w-full items-end gap-2" style={{ gridTemplateColumns: `repeat(${top.length}, minmax(0, 1fr))`, maxWidth: top.length * 124 }}
          variants={listStagger} initial="initial" animate="animate">
          {podiumOrder(top).map(row => {
            const place = row.rank - 1, me = row.id === myPlayerId, medal = MEDAL[place] ?? '#ffffff';
            return (
              <motion.li key={row.id} variants={partyMotion('avatarArrive', reduced)} className="flex flex-col items-center gap-2" data-me={me}>
                <span className="relative rounded-full" style={{ boxShadow: playerGlow(row.color, me ? 'active' : 'soft') }}>
                  <SeatAvatar avatar={row.avatar ?? '🎉'} color={row.color} size={row.rank === 1 ? 84 : 60} />
                  {row.rank === 1 && <Crown className="absolute -top-7 left-1/2 h-8 w-8 -translate-x-1/2 text-[#fbbf24] drop-shadow-[0_0_12px_rgba(251,191,36,.7)]" aria-hidden />}
                </span>
                <span className="flex max-w-full items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-white">{row.name}</span>
                  {me && <span className="rounded-full bg-[#8ff5ff]/15 px-1.5 text-[11px] font-bold text-[#8ff5ff]">{t('partyPlay.roster.you', 'Du')}</span>}
                </span>
                <div className="flex w-full flex-col items-center justify-start rounded-t-2xl pt-2"
                  style={{ height: [170, 125, 95][place] ?? 95, background: `linear-gradient(180deg, ${medal}45, ${medal}10)`,
                    boxShadow: me ? `inset 0 1px 0 ${medal}, ${playerGlow(row.color, 'active')}` : `inset 0 1px 0 ${medal}80` }}>
                  <span className="font-game text-3xl font-black tabular-nums" style={{ color: medal }}>{row.rank}</span>
                  <span className="font-game text-sm font-bold tabular-nums text-white/75">{row.points}</span>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      )}

      {rest.length > 0 && (
        <ol className="mt-4 space-y-2">
          {rest.map(row => (
            <li key={row.id} className={cn('flex min-h-14 items-center gap-3 rounded-2xl px-3', row.id === myPlayerId ? 'bg-[#8ff5ff]/[.08]' : 'bg-white/[.04]')}>
              <span className="w-6 text-center font-game text-lg font-black tabular-nums text-white/60">{row.rank}</span>
              <SeatAvatar avatar={row.avatar ?? '🎉'} color={row.color} size={36} />
              <span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span>
              <span className="font-game font-bold tabular-nums text-white/80">{row.points}</span>
            </li>
          ))}
        </ol>
      )}

      {/* CTAs in the thumb zone. */}
      {history.length > 0 && <PartyRecapCard recap={recap} />}
      </div>
      <PartyBottomBarSpacer />
      <PartyBottomBar testId="closing-actions"><div className="space-y-2">
          <motion.button type="button" {...(reduced ? {} : pressable)} onClick={onStartOwn}
            className={cn('flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#df8eff] to-[#8ff5ff] font-bold text-[#060810]', focus)}>
            <PartyPopper className="h-5 w-5" aria-hidden />{t('partyPlay.removed.startOwn', 'Eigene Party starten')}
          </motion.button>
        <button type="button" data-testid="closing-done" onClick={onDone}
          className={cn('mx-auto block min-h-11 rounded-full px-4 text-sm font-semibold text-white/60 active:bg-white/5', focus)}>
          {t('partyPlay.closing.done', 'Fertig')}
        </button>
      </div></PartyBottomBar>
    </motion.section>
  </>);
}
