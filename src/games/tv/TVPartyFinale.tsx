import { partyChampions } from '@/games/party/standings';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ConfettiBurst } from '@/components/vfx/ConfettiBurst';
import { confettiBurst, partyEase } from '@/lib/party-motion';
import { serverClock } from '@/games/party/scene-clock';
import { tvGrid } from './tv-tokens';
import { useTVAudio } from './TVAudioManager';
import TVPartyPodium from './components/TVPartyPodium';
import TVFinaleAward from './components/TVFinaleAward';
import TVPlayerAvatar from './cinema/TVPlayerAvatar';
import { lu } from './components/tv-lobby-scale';
import { FINALE_AT, finaleSchedule, type FinaleBeat } from './cinema/finale-timeline';
import { computePartyAwards } from './partyAwards';
import type { PartyNightState } from './party-types';

const GOLD = '#FFD23F';

/**
 * TVPartyFinale — die Siegerehrung am Ende des Party-Abends.
 *
 * Der Ablauf haengt an der gemeinsamen Szenenzeit (`startsAt`): Trommelwirbel,
 * dann Podest + Konfetti genau in dem Moment, in dem auch die Telefone feiern
 * (`startsAt + afterDrumrollMs`), danach Auszeichnungen und Endstand. Waehrend
 * des Wirbels steht nichts Leeres im Bild — die Seitenleisten kommen erst mit
 * ihrem Beat. Ein spaet verbundener Fernseher zeigt sofort das fertige Bild.
 *
 * Neben dem Podest gibt es Titel aus dem ganzen Abend (`partyAwards.ts`), die
 * auf verschiedene Leute fallen — so bekommen moeglichst viele einen Moment.
 */
export default function TVPartyFinale({ party, startsAt = null }: { party: PartyNightState; startsAt?: number | null }) {
  const { t, i18n } = useTranslation();
  const reduce = !!useReducedMotion();
  const audio = useTVAudio();
  const audioRef = useRef(audio);
  audioRef.current = audio;

  const standings = useMemo(
    () => [...party.standings].sort((a, b) => a.rank - b.rank || b.points - a.points),
    [party.standings],
  );
  const champions = useMemo(() => partyChampions(standings), [standings]);
  const champion = champions[0];
  const winnerNames = new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(champions.map((entry) => entry.name));
  const awards = useMemo(() => {
    if (!champion) return [];
    return computePartyAwards(party.history ?? [], standings.map((s) => s.id), { excludeIds: champions.map((entry) => entry.id), max: 4 });
  }, [party.history, standings, champion, champions]);
  const byId = useMemo(() => new Map(standings.map((s) => [s.id, s])), [standings]);

  // Einmal beim Einblenden festlegen: Wo im Ablauf steht der Abend gerade?
  const [schedule] = useState(() => finaleSchedule(startsAt !== null ? serverClock.now() - startsAt : 0));
  const [beat, setBeat] = useState<FinaleBeat>(schedule.beat);
  const [confetti, setConfetti] = useState(() => {
    const elapsed = startsAt !== null ? serverClock.now() - startsAt : 0;
    return elapsed >= FINALE_AT[1] && elapsed < FINALE_AT[1] + confettiBurst.durationMs;
  });

  useEffect(() => {
    const stopDrumroll = schedule.live ? audioRef.current.playDrumroll() : () => {};
    const timers = schedule.next.map(({ beat: b, inMs }) => setTimeout(() => {
      if (b === 1) {
        stopDrumroll();
        audioRef.current.playFanfare();
        setConfetti(true);
      }
      setBeat(b);
    }, inMs));
    return () => {
      stopDrumroll();
      timers.forEach(clearTimeout);
    };
  }, [schedule]);

  if (!champion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#060810' }}>
        <span className="font-bold" style={{ fontSize: lu(3.2), color: '#8a82a0' }}>{t('tv.partyNight.noStandings', 'Noch keine Punkte')}</span>
      </div>
    );
  }

  const totalPoints = standings.reduce((sum, s) => sum + s.points, 0);
  const gamesPlayed = party.history?.length ?? party.playlist.filter((p) => p.done).length;
  const revealed = beat >= 1;
  const rail = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: partyEase.out, delay },
  });

  return (
    <div
      data-testid="tv-party-finale"
      data-beat={beat}
      className={`${tvGrid} relative overflow-hidden`}
      style={{ background: 'radial-gradient(circle at 50% 12%, #21172d 0%, #0a0b15 40%, #05070d 100%)' }}
    >
      <motion.div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[64rem] h-[40rem] rounded-full blur-[120px] pointer-events-none"
        animate={{ background: revealed ? `${champion.color}38` : '#df8eff1c', opacity: revealed ? 1 : 0.7 }}
        transition={{ duration: 0.8, ease: partyEase.out }}
      />
      <ConfettiBurst active={confetti && !reduce} count={confettiBurst.particles.tv} onComplete={() => setConfetti(false)} />

      {/* ── Links: der Abend in Zahlen + Endstand — erst mit seinem Beat, nie als leerer Kasten ── */}
      <div className="relative z-10 flex flex-col min-h-0" style={{ gap: lu(1.6) }}>
        <AnimatePresence>
          {beat >= 3 && (
            <motion.div key="numbers" className="grid shrink-0 grid-cols-2 rounded-[1.6rem] border border-[#FFD23F]/20 bg-[#FFD23F]/[0.05]" style={{ gap: lu(1.2), padding: lu(2) }} {...rail()}>
              {[
                { label: t('tv.partyNight.gamesPlayed', 'Spiele'), value: gamesPlayed },
                { label: t('tv.partyNight.totalPoints', 'Punkte gesamt'), value: totalPoints },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col min-w-0" style={{ gap: lu(0.3) }}>
                  <span className="font-bold truncate" style={{ fontSize: lu(1.9), color: '#c9bfdc' }}>{stat.label}</span>
                  <span className="font-black text-white tabular-nums" style={{ fontSize: lu(4.8), lineHeight: 1 }}>{stat.value.toLocaleString(i18n.language)}</span>
                </div>
              ))}
            </motion.div>
          )}
          {beat >= 3 && (
            <motion.div key="board" data-testid="tv-finale-board" className="flex min-h-0 flex-col rounded-[1.6rem] border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl" style={{ padding: lu(2) }} {...rail(0.08)}>
              <span className="font-extrabold shrink-0" style={{ fontSize: lu(2.2), color: '#c9bfdc', marginBottom: lu(1.2) }}>
                {t('tv.partyNight.finalTable', 'Endstand')}
              </span>
              <div className="flex flex-col min-h-0 overflow-y-auto" style={{ gap: lu(0.8) }}>
                {standings.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    className="relative flex items-center rounded-xl border border-white/[0.07] bg-white/[0.035]"
                    style={{ gap: lu(1.2), padding: `${lu(0.7)} ${lu(1.2)}` }}
                    initial={{ opacity: 0, x: reduce ? 0 : -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: partyEase.out, delay: Math.min(0.12 + i * 0.05, 0.6) }}
                  >
                    <span className="shrink-0 font-black tabular-nums text-center" style={{ fontSize: lu(2.2), width: '1.4em', color: entry.rank === 1 ? GOLD : '#8a82a0' }}>{entry.rank}</span>
                    <TVPlayerAvatar id={entry.id} name={entry.name} avatar={entry.avatar} color={entry.color} size={lu(4)} />
                    <span className="flex-1 min-w-0 truncate font-bold text-white" style={{ fontSize: lu(2.2) }}>{entry.name}</span>
                    <span className="shrink-0 font-black tabular-nums" style={{ fontSize: lu(2.2), color: entry.rank === 1 ? GOLD : '#e8e2f4' }}>{entry.points.toLocaleString(i18n.language)}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mitte: die Zeremonie ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-0" style={{ gap: lu(2.4) }}>
        <div className="text-center flex flex-col items-center" style={{ gap: lu(1.2) }}>
          <motion.span
            className="inline-flex items-center rounded-full border border-[#FFD23F]/25 bg-[#FFD23F]/[0.08] font-bold"
            style={{ gap: lu(0.8), padding: `${lu(0.6)} ${lu(1.6)}`, fontSize: lu(2.2), color: GOLD }}
            initial={{ opacity: 0, y: reduce ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: partyEase.out }}
          >
            <span className="rounded-full" style={{ width: lu(0.9), height: lu(0.9), background: GOLD, boxShadow: `0 0 14px ${GOLD}` }} aria-hidden />
            {t('tv.partyNight.finaleEyebrow', 'Der Party-Abend ist vorbei')}
          </motion.span>
          <AnimatePresence mode="wait">
            {revealed ? (
              <motion.h1 key="champion" className="font-black text-white" style={{ fontSize: lu(6), lineHeight: 1.05, textShadow: `0 0 48px ${GOLD}55` }}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: partyEase.out }}>
                {t(champions.length > 1 ? 'tv.partyNight.champions' : 'tv.partyNight.champion', 'Champion des Abends')}
              </motion.h1>
            ) : (
              <motion.h1 key="drumroll" data-testid="tv-finale-drumroll" className="font-black text-white/90 flex flex-col items-center text-center" style={{ fontSize: lu(5), lineHeight: 1.08, gap: lu(2), maxWidth: '22ch', textWrap: 'balance' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 1.04 }} transition={{ duration: 0.35, ease: partyEase.out }}>
                <span>{t('tv.partyNight.drumroll', 'Und der Champion des Abends ist')} …</span>
                <span className="flex" style={{ gap: lu(0.8) }} aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="rounded-full" style={{ width: lu(1.4), height: lu(1.4), background: GOLD }}
                      animate={reduce ? { opacity: 0.8 } : { opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} />
                  ))}
                </span>
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <TVPartyPodium entries={standings} reveal={revealed} variant="finale" className="max-w-[min(56rem,100%)]" />

        <AnimatePresence>
          {beat >= 2 && (
            <motion.div
              key="line"
              className="relative overflow-hidden rounded-full border border-[#FFD23F]/25 bg-[#FFD23F]/[0.08]"
              style={{ padding: `${lu(1)} ${lu(2.4)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 20px 50px -34px ${GOLD}b0` }}
              {...rail()}
            >
              <span className="font-black text-white" style={{ fontSize: lu(2.6) }}>
                {t(champions.length > 1 ? 'tv.partyNight.championsLine' : 'tv.partyNight.championLine', '{{name}} gewinnt mit {{points}} Punkten', {
                  name: winnerNames,
                  points: champion.points.toLocaleString(i18n.language),
                })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Rechts: die Auszeichnungen ── */}
      <div className="relative z-10 flex flex-col min-h-0">
        <AnimatePresence>
          {beat >= 2 && (
            <motion.div key="awards" className="flex flex-col min-h-0" style={{ gap: lu(1.2) }} {...rail()}>
              <span className="font-extrabold shrink-0" style={{ fontSize: lu(2.2), color: '#c9bfdc' }}>{t('tv.partyNight.awardsTitle', 'Auszeichnungen')}</span>
              {awards.map((award, i) => {
                const player = byId.get(award.playerId);
                return player ? <TVFinaleAward key={award.key} award={award} player={player} index={i} /> : null;
              })}
              {!awards.length && (
                <span className="font-semibold" style={{ fontSize: lu(2), color: '#8a82a0' }}>{t('tv.partyNight.noAwards', 'Zu wenig gespielt für Auszeichnungen')}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
