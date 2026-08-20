/**
 * OHNE WORTE auf dem Fernseher.
 *
 * DIE EINE REGEL, die alles andere schlägt: Der BEGRIFF darf hier nie stehen.
 * Alle im Raum schauen auf den Fernseher — stünde der Begriff dort, wäre das
 * Spiel in derselben Sekunde vorbei. Er kommt deshalb gar nicht erst im
 * Zustand an (siehe `tvPayload` in `PantomimeGame.tsx`).
 *
 * Die HERAUSFORDERUNG dagegen MUSS hier stehen. Nur so sieht die Gruppe, ob
 * der Kochlöffel wirklich benutzt wurde — sonst wären die doppelten Punkte
 * Ehrensache statt Spiel.
 *
 * Defensiv destrukturiert: Ein Fernseher kann sich jederzeit verbinden und
 * bekommt dann einen unvollständigen Zustand.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TVTimer from '../components/TVTimer';
import { tvPanel, tvType } from '../tv-tokens';

interface Props {
  gameState: Record<string, unknown>;
}

const PM = {
  gold: '#FBBF24',
  dim: '#A79FC0',
  text: '#F5F3FF',
  good: '#34D399',
};

interface TeamState {
  name: string;
  color: string;
  score: number;
  players: string[];
}

export default function TVPantomimeView({ gameState }: Props) {
  const reduce = useReducedMotion();
  const { t } = useTranslation();
  const s = (gameState ?? {}) as Record<string, unknown>;

  const phase = String(s.phase ?? 'turnStart');
  const round = Number(s.round ?? 1);
  const totalRounds = Number(s.totalRounds ?? 1);
  const activeTeamIdx = Number(s.activeTeamIdx ?? 0);
  const actor = String(s.actor ?? '');
  const timeLeft = Number(s.timeLeft ?? 0);
  const totalTime = Number(s.totalTime ?? 90);
  const correctCount = Number(s.correctCount ?? 0);
  const fetchLeft = Number(s.fetchLeft ?? 0);
  const extra = (s.extra ?? null) as { text?: string; kind?: string } | null;

  const teams = useMemo<TeamState[]>(() => {
    const raw = Array.isArray(s.teams) ? s.teams : [];
    return raw.map((tm) => {
      const q = tm as Record<string, unknown>;
      return {
        name: String(q.name ?? ''),
        color: String(q.color ?? PM.gold),
        score: Number(q.score ?? 0),
        players: Array.isArray(q.players) ? (q.players as string[]) : [],
      };
    });
  }, [s.teams]);

  return (
    <div className="w-full h-full flex flex-col" style={{ color: PM.text }}>
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-[3vw] pt-[2vh]">
        <span style={{ fontSize: tvType.label, color: PM.dim }}>
          {t('games.pantomime.roundOf', { round, total: totalRounds })}
        </span>
        <div className="flex items-center gap-[2vw]">
          {teams.map((tm, i) => (
            <span
              key={tm.name || i}
              className="font-black px-[1.2vw] py-[0.4vh] rounded-full"
              style={{
                fontSize: tvType.label,
                background: i === activeTeamIdx ? tm.color : 'transparent',
                color: i === activeTeamIdx ? '#0C0A14' : tm.color,
                border: `2px solid ${tm.color}`,
              }}
            >
              {tm.name} {tm.score}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-[2vh] px-[3vw]">
        {/* Wer stellt dar */}
        <p className="font-black text-center" style={{ fontSize: tvType.display }}>
          {actor ? t('games.pantomime.watching', { name: actor }) : t('games.pantomime.title')}
        </p>

        <AnimatePresence mode="wait">
          {/* Holzeit für das Requisit */}
          {phase === 'fetch' && (
            <motion.div
              key="fetch"
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p style={{ fontSize: tvType.body, color: PM.dim }}>
                {t('games.pantomime.fetchTitle')}
              </p>
              <p className="font-black tabular-nums" style={{ fontSize: tvType.hero, color: PM.gold }}>
                {fetchLeft}
              </p>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-[2vh]"
            >
              <TVTimer timeLeft={timeLeft} totalTime={totalTime} />
              <p className="font-black" style={{ fontSize: tvType.title, color: PM.good }}>
                {t('games.pantomime.wordsSoFar', { count: correctCount })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Die Herausforderung — der Grund, warum die Gruppe überhaupt
            mitbekommt, wonach sie schauen soll. */}
        <AnimatePresence>
          {extra?.text && (
            <motion.div
              key="extra"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={tvPanel}
              style={{
                padding: '2vh 3vw',
                borderColor: 'rgba(251,191,36,0.4)',
                boxShadow: '0 0 6vh rgba(251,191,36,0.15)',
              }}
            >
              <p
                className="text-center font-black uppercase tracking-widest"
                style={{ fontSize: tvType.micro, color: PM.gold }}
              >
                {t('games.pantomime.extraTitle')}
              </p>
              <p className="text-center font-black mt-[0.6vh]" style={{ fontSize: tvType.title }}>
                {extra.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fußzeile: wer in welchem Team spielt */}
      <div className="flex items-start justify-center gap-[4vw] px-[3vw] pb-[2vh]">
        {teams.map((tm, i) => (
          <div key={tm.name || i} className="text-center max-w-[35vw]">
            <p className="font-black" style={{ fontSize: tvType.label, color: tm.color }}>
              {tm.name}
            </p>
            <p style={{ fontSize: tvType.micro, color: PM.dim }}>{tm.players.join(' · ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
