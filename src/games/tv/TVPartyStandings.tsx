import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Trophy } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { ConfettiBurst } from '@/components/vfx/ConfettiBurst';
import { tvGrid, tvType, tvActiveRing } from './tv-tokens';
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
 *   4  cinematic hand-off to the next stop on the party map
 */
const spring = { type: 'spring' as const, stiffness: 230, damping: 22 };

const BEATS: [number, number, number, number] = [1100, 2300, 3400, 7200];

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
      className="relative flex items-center gap-[clamp(0.5rem,0.9vw,1rem)] overflow-hidden rounded-[clamp(1rem,1.5vw,1.5rem)] px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.45rem,0.8vh,0.8rem)]"
      style={{
        background: isLeader ? `linear-gradient(110deg, ${entry.color}24, rgba(255,255,255,.045) 62%)` : 'rgba(255,255,255,.035)',
        border: `1px solid ${isLeader ? `${entry.color}70` : 'rgba(255,255,255,0.075)'}`,
        boxShadow: isLeader ? `inset 0 1px 0 rgba(255,255,255,.1), 0 16px 40px -30px ${entry.color}` : 'inset 0 1px 0 rgba(255,255,255,.05)',
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={reveal ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
      transition={{ ...spring, delay: Math.min(index * 0.05, 0.5) }}
    >
      <span aria-hidden className="absolute inset-y-[18%] left-0 w-[3px] rounded-full" style={{ background: entry.color, opacity: isLeader ? 1 : 0.38, boxShadow: isLeader ? `0 0 18px ${entry.color}` : undefined }} />
      <span
        className="shrink-0 font-black tabular-nums text-center"
        style={{
          fontSize: tvType.body,
          width: '1.6em',
          color: entry.rank === 1 ? '#FFD23F' : entry.rank === 2 ? '#cfd3dc' : entry.rank === 3 ? '#e0915b' : '#6b6480',
        }}
      >
        {String(entry.rank).padStart(2, '0')}
      </span>
      <span
        className="shrink-0 rounded-full flex items-center justify-center font-black text-white"
        style={{
          width: 'clamp(1.9rem,2.4vw,2.6rem)',
          height: 'clamp(1.9rem,2.4vw,2.6rem)',
          fontSize: tvType.micro,
          background: `linear-gradient(145deg, ${entry.color}, #0b0b18)`,
          border: `1.5px solid ${entry.color}`,
          boxShadow: isLeader ? `0 0 22px ${entry.color}66` : undefined,
        }}
      >
        {entry.avatar || entry.name?.slice(0, 1).toUpperCase()}
      </span>
      <span className="flex-1 min-w-0 truncate font-black text-white" style={{ fontSize: tvType.label }}>
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
  // Der Playlist-Zeiger rueckt erst mit "Weiter". `finishedThrough` zeigt im
  // Zwischenstand bereits auf das wirklich naechste Spiel.
  const nextGame = party.playlist[party.finishedThrough];

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
      setTimeout(() => setBeat(4), BEATS[3]),
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
    <div
      className={`${tvGrid} relative overflow-hidden`}
      style={{ background: 'radial-gradient(circle at 50% 18%, #17102b 0%, #080a14 42%, #05070d 100%)' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(223,142,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,245,255,.05) 1px,transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'radial-gradient(circle at 50% 42%,black,transparent 78%)',
        }}
      />
      {/* Static leader wash — no loop, so it costs nothing on a WebView */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[58rem] h-[36rem] rounded-full blur-[120px] pointer-events-none"
        style={{ background: `${leader.color}24` }}
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
          animate={{ opacity: beat >= 4 ? 1 : 0 }}
          transition={{ duration: 0.55 }}
          style={{ pointerEvents: 'none' }}
        >
          {beat >= 4 && (
            <TVPartyMap
              playlist={party.playlist}
              /* Der Sprung geht vom eben beendeten Feld auf das naechste.
                 `party.index` zeigt hier noch auf das beendete Spiel — der
                 Zeiger rueckt erst mit "Weiter". Ueber `finishedThrough`
                 stimmt beides. */
              from={Math.max(0, party.finishedThrough - 1)}
              index={party.finishedThrough}
              standings={party.standings}
              travel
            />
          )}
        </motion.div>
      )}

      {/* ── Left rail: the evening's roadmap ── */}
      <TVPartyRoadmap
        playlist={party.playlist}
        index={party.finishedThrough}
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
            className="inline-flex items-center gap-[.55em] rounded-full border border-[#8ff5ff]/20 bg-[#8ff5ff]/8 px-[1em] py-[.45em] uppercase font-black tracking-[0.28em]"
            style={{ fontSize: tvType.micro, color: '#9bf7ff' }}
          >
            <span className="h-[.55em] w-[.55em] rounded-full bg-[#8ff5ff] shadow-[0_0_14px_#8ff5ff]" aria-hidden />
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
            className="flex items-center gap-[0.5em] rounded-full border border-[#26E0C4]/25 bg-[#26E0C4]/10 px-[clamp(0.9rem,1.6vw,1.6rem)] py-[clamp(0.3rem,0.6vh,0.6rem)]"
            style={{ color: '#71f5df', ...tvActiveRing(leader.color) }}
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

        <TVPartyPodium
          entries={standings}
          reveal={beat >= 1}
          showDelta
          variant="standings"
          className="max-w-[min(49rem,100%)]"
        />

        {nextGame && (
          <motion.div
            className="relative flex items-center gap-[clamp(0.5rem,1vw,1rem)] overflow-hidden rounded-[24px] border border-[#df8eff]/22 bg-white/[0.045] px-[clamp(1rem,1.8vw,2rem)] py-[clamp(0.6rem,1vh,1rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]"
            initial={{ opacity: 0, y: 14 }}
            animate={beat >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={spring}
          >
            <span className="absolute inset-y-[22%] left-0 w-[3px] rounded-full bg-[#df8eff] shadow-[0_0_16px_#df8eff]" aria-hidden />
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
      <div className="relative z-10 flex min-h-0 flex-col rounded-[28px] border border-white/[0.075] bg-white/[0.035] p-[clamp(0.9rem,1.6vw,1.75rem)] shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_30px_80px_-56px_rgba(223,142,255,.65)] backdrop-blur-xl">
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
