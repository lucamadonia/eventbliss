import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Trophy } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { ConfettiBurst } from '@/components/vfx/ConfettiBurst';
import { tvGrid, tvPanel, tvType, tvActiveRing } from './tv-tokens';
import { useTVAudio } from './TVAudioManager';
import TVPartyPodium from './components/TVPartyPodium';
import TVPartyRoadmap from './components/TVPartyRoadmap';
import TVPartyMap from './components/TVPartyMap';
import TVRankDelta from './components/TVRankDelta';
import type { PartyNightState, PartyStanding } from './party-types';

/**
 * TVPartyStandings — the between-games broadcast moment of a Party Night.
 *
 * Until now the phone's `game: 'lobby'` state fell through to TVSmartFallback,
 * which had no idea what a party night is. This is the dedicated scene: a
 * drumroll into the podium, animated rank deltas versus the previous game, the
 * full ranked board, and the roadmap of the evening — so every guest can see
 * where they stand and what is coming without anyone reaching for a phone.
 *
 * Beat timeline (matches TVGameOver's cinematic pacing):
 *   0  drumroll + headline
 *   1  podium rises, fanfare, confetti if the lead changed hands
 *   2  full ranked board fills in
 *   3  roadmap + "up next"
 */
const spring = { type: 'spring' as const, stiffness: 230, damping: 22 };

const BEATS: [number, number, number] = [1100, 2300, 3200];

function BoardRow({
  entry,
  index,
  reveal,
}: {
  entry: PartyStanding;
  index: number;
  reveal: boolean;
}) {
  const isLeader = entry.rank === 1;
  return (
    <motion.div
      className="flex items-center gap-[clamp(0.5rem,0.9vw,1rem)] rounded-2xl px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.4rem,0.8vh,0.75rem)]"
      style={{
        background: isLeader ? `linear-gradient(120deg, ${entry.color}1f, #140e24 60%)` : '#140e24',
        border: `1.5px solid ${isLeader ? `${entry.color}66` : 'rgba(255,255,255,0.08)'}`,
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={reveal ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
      transition={{ ...spring, delay: Math.min(index * 0.05, 0.5) }}
    >
      <span
        className="shrink-0 font-black tabular-nums text-center"
        style={{
          fontSize: tvType.body,
          width: '1.6em',
          color: entry.rank === 1 ? '#FFD23F' : entry.rank === 2 ? '#cfd3dc' : entry.rank === 3 ? '#e0915b' : '#6b6480',
        }}
      >
        {entry.rank}
      </span>
      <span
        className="shrink-0 rounded-full flex items-center justify-center font-black text-white"
        style={{
          width: 'clamp(1.9rem,2.4vw,2.6rem)',
          height: 'clamp(1.9rem,2.4vw,2.6rem)',
          fontSize: tvType.micro,
          background: entry.color,
        }}
      >
        {entry.avatar || entry.name?.slice(0, 1).toUpperCase()}
      </span>
      <span className="flex-1 min-w-0 truncate font-bold text-white" style={{ fontSize: tvType.label }}>
        {entry.name}
      </span>
      {(entry.streak ?? 0) >= 2 && (
        <span
          className="inline-flex items-center gap-[0.1em] shrink-0 font-black tabular-nums"
          style={{ fontSize: tvType.micro, color: '#ff6b98' }}
        >
          <Flame style={{ width: '1em', height: '1em' }} strokeWidth={2.5} />
          {entry.streak}
        </span>
      )}
      <TVRankDelta rank={entry.rank} prevRank={entry.prevRank} size={tvType.label} />
      <span
        className="shrink-0 font-black tabular-nums"
        style={{ fontSize: tvType.label, color: isLeader ? entry.color : '#b3a8c9' }}
      >
        {entry.points.toLocaleString('de-DE')}
      </span>
    </motion.div>
  );
}

export default function TVPartyStandings({ party }: { party: PartyNightState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const audio = useTVAudio();
  const audioRef = useRef(audio);
  audioRef.current = audio;

  const standings = [...party.standings].sort((a, b) => a.rank - b.rank || b.points - a.points);
  const leader = standings[0];
  const leaderChanged = !!leader && leader.prevRank !== null && leader.prevRank > 1;
  const nextGame = party.playlist[party.index];

  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const stopDrumroll = audioRef.current.playDrumroll();
    const timers = [
      setTimeout(() => {
        stopDrumroll();
        audioRef.current.playFanfare();
        setBeat(1);
      }, BEATS[0]),
      setTimeout(() => setBeat(2), BEATS[1]),
      setTimeout(() => {
        setBeat(3);
        audioRef.current.playChime();
      }, BEATS[2]),
    ];
    return () => {
      stopDrumroll();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!leader) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#060810' }}>
        <span style={{ fontSize: tvType.title, color: '#6b6480' }}>
          {t('tv.partyNight.noStandings', 'Noch keine Punkte')}
        </span>
      </div>
    );
  }

  return (
    <div className={`${tvGrid} relative overflow-hidden`} style={{ backgroundColor: '#060810' }}>
      {/* Static leader wash — no loop, so it costs nothing on a WebView */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[55rem] h-[34rem] rounded-full blur-[120px] pointer-events-none"
        style={{ background: `${leader.color}1a` }}
      />

      <ConfettiBurst active={beat >= 1 && leaderChanged && ambient} count={40} />

      {/*
        Takt 3: Die Nacht-Route uebernimmt den ganzen Bildschirm und die Gruppe
        springt sichtbar auf das naechste Feld. Bewusst als Ueberblendung UEBER
        das Raster statt als vierte Spalte darin — der Sprung ist der Moment,
        auf den der Abend hinlaeuft, und der braucht die volle Flaeche.
        Die schmale Roadmap links bleibt fuer die Takte davor bestehen.
      */}
      {party.playlist.length > 0 && (
        <motion.div
          className="absolute inset-0 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: beat >= 3 ? 1 : 0 }}
          transition={{ duration: 0.55 }}
          style={{ pointerEvents: 'none' }}
        >
          {beat >= 3 && (
            <TVPartyMap
              playlist={party.playlist}
              index={party.index}
              standings={party.standings}
              travel
            />
          )}
        </motion.div>
      )}

      {/* ── Left rail: the evening's roadmap ── */}
      <TVPartyRoadmap
        playlist={party.playlist}
        index={party.index}
        reveal={beat >= 3}
        className="relative z-10 max-h-full"
      />

      {/* ── Hero: headline + podium + what's next ── */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-[clamp(0.75rem,1.8vh,2rem)] min-h-0">
        <motion.div
          className="text-center flex flex-col items-center gap-[0.3em]"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <span
            className="uppercase font-black tracking-[0.3em]"
            style={{ fontSize: tvType.label, color: '#b3a8c9' }}
          >
            {t('tv.partyNight.standingsEyebrow', 'Zwischenstand')}
          </span>
          <span className="font-black text-white" style={{ fontSize: tvType.title, lineHeight: 1.1 }}>
            {party.lastGameName
              ? t('tv.partyNight.afterGame', 'Nach {{game}}', { game: party.lastGameName })
              : t('tv.partyNight.title', 'Party Night')}
          </span>
        </motion.div>

        {leaderChanged && (
          <motion.div
            className="flex items-center gap-[0.5em] rounded-full px-[clamp(0.9rem,1.6vw,1.6rem)] py-[clamp(0.3rem,0.6vh,0.6rem)]"
            style={{ background: '#16101f', ...tvActiveRing(leader.color) }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={beat >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ ...spring, delay: 0.3 }}
          >
            <Trophy style={{ width: '1em', height: '1em', fontSize: tvType.body, color: '#FFD23F' }} strokeWidth={2.5} />
            <span className="font-black text-white" style={{ fontSize: tvType.body }}>
              {t('tv.partyNight.leadChange', 'Führungswechsel: {{name}}', { name: leader.name })}
            </span>
          </motion.div>
        )}

        <TVPartyPodium entries={standings} reveal={beat >= 1} showDelta className="max-w-[min(46rem,100%)]" />

        {nextGame && (
          <motion.div
            className={`${tvPanel} flex items-center gap-[clamp(0.5rem,1vw,1rem)] px-[clamp(1rem,1.8vw,2rem)] py-[clamp(0.5rem,1vh,1rem)]`}
            initial={{ opacity: 0, y: 14 }}
            animate={beat >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={spring}
          >
            <span
              className="uppercase font-black tracking-[0.24em]"
              style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
            >
              {t('tv.partyNight.upNext', 'Als Nächstes')}
            </span>
            <span className="font-black text-white truncate" style={{ fontSize: tvType.body }}>
              {nextGame.name}
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Right rail: the full ranked board ── */}
      <div className={`${tvPanel} relative z-10 flex flex-col min-h-0 p-[clamp(0.9rem,1.6vw,1.75rem)]`}>
        <span
          className="uppercase font-black tracking-[0.24em] mb-[clamp(0.5rem,1vh,1rem)] shrink-0"
          style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
        >
          {t('tv.partyNight.tonightTotal', 'Gesamt heute Abend')}
        </span>
        <div className="flex flex-col gap-[clamp(0.3rem,0.6vh,0.6rem)] min-h-0 overflow-y-auto">
          {standings.map((entry, i) => (
            <BoardRow key={entry.id} entry={entry} index={i} reveal={beat >= 2} />
          ))}
        </div>
      </div>
    </div>
  );
}
