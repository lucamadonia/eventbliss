import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CloudRain, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAmbientMotion } from '@/lib/useAmbientMotion';
import { ConfettiBurst } from '@/components/vfx/ConfettiBurst';
import { tvGrid, tvPanel, tvPanelRaised, tvType } from './tv-tokens';
import { useTVAudio } from './TVAudioManager';
import TVPartyPodium from './components/TVPartyPodium';
import { computePartyAwards } from './partyAwards';
import type { PartyAward, PartyAwardKey } from './partyAwards';
import type { PartyNightState, PartyStanding } from './party-types';

/**
 * TVPartyFinale — the award ceremony that closes a Party Night.
 *
 * The podium alone would only celebrate one person, so beyond it we hand out
 * titles derived from the whole evening (see `partyAwards.ts`): the comeback,
 * the metronome, the record holder, the unlucky one. Awards are guaranteed to
 * land on different people, so as much of the party as possible gets a moment.
 *
 * Beat timeline: 0 drumroll → 1 podium + confetti → 2 awards → 3 numbers/board.
 */
const spring = { type: 'spring' as const, stiffness: 230, damping: 22 };
const BEATS: [number, number, number] = [1200, 2600, 3600];

interface AwardMeta {
  icon: LucideIcon;
  color: string;
}

const AWARD_META: Record<PartyAwardKey, AwardMeta> = {
  comeback: { icon: TrendingUp, color: '#26E0C4' },
  mostWins: { icon: Trophy, color: '#FFD23F' },
  consistency: { icon: Target, color: '#8ff5ff' },
  bestGame: { icon: Zap, color: '#df8eff' },
  unlucky: { icon: CloudRain, color: '#ff6b98' },
};

const AWARD_TITLE_DE: Record<PartyAwardKey, string> = {
  comeback: 'Comeback des Abends',
  mostWins: 'Seriensieger',
  consistency: 'Konstanz-König',
  bestGame: 'Bestleistung des Abends',
  unlucky: 'Pechvogel',
};

function AwardCard({
  award,
  player,
  index,
  reveal,
}: {
  award: PartyAward;
  player: PartyStanding;
  index: number;
  reveal: boolean;
}) {
  const { t } = useTranslation();
  const meta = AWARD_META[award.key];
  const Icon = meta.icon;

  const detail = (() => {
    switch (award.key) {
      case 'comeback':
        return t('tv.partyNight.award.comeback.detail', 'Von Platz {{from}} auf Platz {{to}}', {
          from: award.from,
          to: award.to,
        });
      case 'mostWins':
        return t('tv.partyNight.award.mostWins.detail', '{{n}} Siege', { n: award.value });
      case 'consistency':
        return t('tv.partyNight.award.consistency.detail', 'Ø Platz {{value}}', {
          value: award.value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        });
      case 'bestGame':
        return t('tv.partyNight.award.bestGame.detail', 'Rekord: {{value}} Punkte in {{game}}', {
          value: award.value,
          game: award.gameName ?? '',
        });
      case 'unlucky':
      default:
        return t('tv.partyNight.award.unlucky.detail', '{{n}}× Letzter', { n: award.value });
    }
  })();

  return (
    <motion.div
      className={`${tvPanel} flex items-center gap-[clamp(0.6rem,1.1vw,1.1rem)] px-[clamp(0.7rem,1.2vw,1.2rem)] py-[clamp(0.5rem,0.9vh,0.9rem)]`}
      style={{ borderColor: `${meta.color}44` }}
      initial={{ opacity: 0, x: 22 }}
      animate={reveal ? { opacity: 1, x: 0 } : { opacity: 0, x: 22 }}
      transition={{ ...spring, delay: 0.08 + index * 0.12 }}
    >
      <span
        className="shrink-0 rounded-2xl flex items-center justify-center"
        style={{
          width: 'clamp(2.2rem,3vw,3.2rem)',
          height: 'clamp(2.2rem,3vw,3.2rem)',
          background: `${meta.color}1f`,
          border: `1.5px solid ${meta.color}55`,
          color: meta.color,
        }}
      >
        <Icon style={{ width: '55%', height: '55%' }} strokeWidth={2.5} />
      </span>
      <div className="min-w-0 leading-tight flex flex-col gap-[0.1em]">
        <span
          className="uppercase font-black tracking-[0.18em] truncate"
          style={{ fontSize: tvType.micro, color: meta.color }}
        >
          {t(`tv.partyNight.award.${award.key}.title`, AWARD_TITLE_DE[award.key])}
        </span>
        <span className="font-black text-white truncate" style={{ fontSize: tvType.label }}>
          {player.avatar ? `${player.avatar} ` : ''}
          {player.name}
        </span>
        <span className="truncate font-bold" style={{ fontSize: tvType.micro, color: '#b3a8c9' }}>
          {detail}
        </span>
      </div>
    </motion.div>
  );
}

export default function TVPartyFinale({ party }: { party: PartyNightState }) {
  const { t } = useTranslation();
  const ambient = useAmbientMotion();
  const audio = useTVAudio();
  const audioRef = useRef(audio);
  audioRef.current = audio;

  const standings = useMemo(
    () => [...party.standings].sort((a, b) => a.rank - b.rank || b.points - a.points),
    [party.standings],
  );
  const champion = standings[0];

  const awards = useMemo(() => {
    if (!champion) return [];
    return computePartyAwards(
      party.history ?? [],
      standings.map((s) => s.id),
      { excludeIds: [champion.id], max: 4 },
    );
  }, [party.history, standings, champion]);

  const byId = useMemo(() => new Map(standings.map((s) => [s.id, s])), [standings]);

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
      setTimeout(() => setBeat(3), BEATS[2]),
    ];
    return () => {
      stopDrumroll();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!champion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#060810' }}>
        <span style={{ fontSize: tvType.title, color: '#6b6480' }}>
          {t('tv.partyNight.noStandings', 'Noch keine Punkte')}
        </span>
      </div>
    );
  }

  const totalPoints = standings.reduce((sum, s) => sum + s.points, 0);
  const gamesPlayed = party.history?.length ?? party.playlist.filter((p) => p.done).length;

  return (
    <div className={`${tvGrid} relative overflow-hidden`} style={{ backgroundColor: '#060810' }}>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[38rem] rounded-full blur-[120px] pointer-events-none"
        style={{ background: `${champion.color}24` }}
      />

      <ConfettiBurst active={beat >= 1 && ambient} count={56} />

      {/* ── Left rail: the evening in numbers + the full board ── */}
      <div className="relative z-10 flex flex-col gap-[clamp(0.5rem,1vh,1rem)] min-h-0">
        <motion.div
          className={`${tvPanel} grid grid-cols-2 gap-[clamp(0.4rem,0.8vw,0.8rem)] p-[clamp(0.8rem,1.4vw,1.5rem)] shrink-0`}
          initial={{ opacity: 0, x: -18 }}
          animate={beat >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -18 }}
          transition={spring}
        >
          {[
            { label: t('tv.partyNight.gamesPlayed', 'Spiele'), value: gamesPlayed },
            { label: t('tv.partyNight.totalPoints', 'Punkte gesamt'), value: totalPoints },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-start gap-[0.1em] min-w-0">
              <span
                className="uppercase font-black tracking-[0.2em] truncate"
                style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
              >
                {stat.label}
              </span>
              <span className="font-black text-white tabular-nums" style={{ fontSize: tvType.title }}>
                {stat.value.toLocaleString('de-DE')}
              </span>
            </div>
          ))}
        </motion.div>

        <div className={`${tvPanel} flex flex-col min-h-0 p-[clamp(0.8rem,1.4vw,1.5rem)]`}>
          <span
            className="uppercase font-black tracking-[0.24em] mb-[clamp(0.4rem,0.8vh,0.8rem)] shrink-0"
            style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
          >
            {t('tv.partyNight.finalTable', 'Endstand')}
          </span>
          <div className="flex flex-col gap-[clamp(0.25rem,0.5vh,0.5rem)] min-h-0 overflow-y-auto">
            {standings.map((entry, i) => (
              <motion.div
                key={entry.id}
                className="flex items-center gap-[clamp(0.4rem,0.8vw,0.8rem)] rounded-xl px-[clamp(0.5rem,0.8vw,0.8rem)] py-[clamp(0.3rem,0.5vh,0.5rem)]"
                style={{ background: '#140e24', border: '1.5px solid rgba(255,255,255,0.08)' }}
                initial={{ opacity: 0, x: -14 }}
                animate={beat >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                transition={{ ...spring, delay: Math.min(0.1 + i * 0.04, 0.5) }}
              >
                <span
                  className="shrink-0 font-black tabular-nums text-center"
                  style={{ fontSize: tvType.label, width: '1.5em', color: '#6b6480' }}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 min-w-0 truncate font-bold text-white" style={{ fontSize: tvType.label }}>
                  {entry.avatar ? `${entry.avatar} ` : ''}
                  {entry.name}
                </span>
                <span
                  className="shrink-0 font-black tabular-nums"
                  style={{ fontSize: tvType.label, color: entry.color }}
                >
                  {entry.points.toLocaleString('de-DE')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero: the ceremony ── */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-[clamp(0.75rem,1.8vh,2rem)] min-h-0">
        <motion.div
          className="text-center flex flex-col items-center gap-[0.25em]"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <span
            className="uppercase font-black tracking-[0.3em]"
            style={{ fontSize: tvType.label, color: '#b3a8c9' }}
          >
            {t('tv.partyNight.finaleEyebrow', 'Die Party Night ist vorbei')}
          </span>
          <span className="font-black text-white" style={{ fontSize: tvType.title, lineHeight: 1.1 }}>
            {t('tv.partyNight.champion', 'Champion des Abends')}
          </span>
        </motion.div>

        <TVPartyPodium entries={standings} reveal={beat >= 1} className="max-w-[min(48rem,100%)]" />

        <motion.div
          className={`${tvPanelRaised} px-[clamp(1rem,1.8vw,2rem)] py-[clamp(0.5rem,1vh,1rem)]`}
          initial={{ opacity: 0, y: 14 }}
          animate={beat >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={spring}
        >
          <span className="font-black text-white" style={{ fontSize: tvType.body }}>
            {t('tv.partyNight.championLine', '{{name}} gewinnt mit {{points}} Punkten', {
              name: champion.name,
              points: champion.points.toLocaleString('de-DE'),
            })}
          </span>
        </motion.div>
      </div>

      {/* ── Right rail: the side awards ── */}
      <div className="relative z-10 flex flex-col min-h-0">
        <span
          className="uppercase font-black tracking-[0.24em] mb-[clamp(0.5rem,1vh,1rem)] shrink-0"
          style={{ fontSize: tvType.micro, color: '#b3a8c9' }}
        >
          {t('tv.partyNight.awardsTitle', 'Auszeichnungen')}
        </span>
        <div className="flex flex-col gap-[clamp(0.4rem,0.8vh,0.8rem)] min-h-0 overflow-y-auto">
          {awards.map((award, i) => {
            const player = byId.get(award.playerId);
            if (!player) return null;
            return (
              <AwardCard key={award.key} award={award} player={player} index={i} reveal={beat >= 2} />
            );
          })}
          {!awards.length && (
            <span className="font-bold" style={{ fontSize: tvType.label, color: '#6b6480' }}>
              {t('tv.partyNight.noAwards', 'Zu wenig gespielt für Auszeichnungen')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
