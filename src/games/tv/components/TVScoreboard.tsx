import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, X } from 'lucide-react';
import { tvType, tvActiveRing } from '../tv-tokens';
import { lu } from './tv-lobby-scale';

/** Schein einer Ranglisten-Karte — nie undefined, damit kein alter Ring stehen bleibt. */
export function scoreChipShadow(isActive: boolean, isLeader: boolean, color: string): string {
  if (isActive) return String(tvActiveRing(color).boxShadow);
  return isLeader ? `0 0 28px -8px ${color}` : 'none';
}
import { withPartyContext } from '../withPartyContext';
import type { PartyNightState } from '../party-types';
import TVPlayerAvatar from '../cinema/TVPlayerAvatar';

/**
 * TVScoreboard — the shared "every player is on screen" roster for all TV views.
 *
 * The TV is the group's shared canvas, so it always shows the WHOLE party, not
 * just the active player: avatar, name, score (+ optional target progress),
 * leader crown, a per-game subtitle (hooks, streak, penalties…), and a clear
 * status treatment (active ring / done ✓ / out / waiting). Drop it into the
 * bottom strip (`layout="strip"`) or a side rail (`layout="rail"`).
 */
export interface TVScorePlayer {
  id: string;
  name: string;
  color: string;
  score?: number;
  /** small line under the name, e.g. "3 🎣", "🔥 4", "2 Strafen" */
  subtitle?: string;
  /** drives the visual treatment; defaults to 'active' for the activeId player */
  status?: 'active' | 'done' | 'out' | 'waiting';
  avatar?: string;
  /** Team members, shown on the shared TV so the name has an owner. */
  members?: readonly string[];
  /**
   * Party Night context — the player's rank and point total for the WHOLE
   * evening, shown as a compact inline chip next to the in-game score.
   *
   * Both are optional on purpose: without them the chip is not rendered and
   * every existing view looks exactly as before. This is how "wo stehe ich
   * heute Abend?" reaches all 19 game views without a floating overlay — an
   * always-on stats overlay was tried here once and removed because it
   * duplicated this roster and covered game content.
   */
  partyRank?: number;
  partyPoints?: number;
}

interface Props {
  players: TVScorePlayer[];
  activeId?: string | null;
  /** when set, each chip shows a score/target progress bar */
  target?: number;
  /** 'strip' = horizontal bottom bar, 'rail' = vertical side column */
  layout?: 'strip' | 'rail';
  /** sort by score desc (default) or keep play order (e.g. turn order) */
  sort?: 'score' | 'order';
  /**
   * Party Night context, straight off the wire (`gameState.partyNight`).
   *
   * Every view passes this one prop instead of matching rosters itself; the
   * matching lives in `withPartyContext` so it exists exactly once. Players
   * are matched by id, falling back to a normalised name. Absent or inactive
   * => the roster is returned by reference and nothing changes.
   */
  party?: PartyNightState | null;
  className?: string;
}

function TVScoreboardImpl({ players: rawPlayers, activeId, target, layout = 'strip', sort = 'score', party, className }: Props) {
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  // Memoised so an active party night does not defeat the memo() below and
  // re-render the whole roster on the TV's per-second tick.
  const players = useMemo(() => withPartyContext(rawPlayers, party), [rawPlayers, party]);

  const hasScores = players.some((p) => typeof p.score === 'number');
  const ordered = sort === 'score' && hasScores
    ? [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : players;
  const leaderScore = Math.max(0, ...players.map((p) => p.score ?? 0));

  const isRail = layout === 'rail';
  const openTeam = players.find((player) => player.id === openTeamId && player.members?.length);

  return (
    <>
    <div className={`flex ${isRail ? 'flex-col' : 'flex-wrap justify-center'} gap-2.5 ${className ?? ''}`}>
      {ordered.map((p, i) => {
        const status = p.status ?? (p.id === activeId ? 'active' : 'waiting');
        const isActive = status === 'active';
        const isLeader = hasScores && (p.score ?? 0) === leaderScore && leaderScore > 0;
        // „Fertig“ ist ein ✓, kein Abdunkeln — nur wer ausgeschieden ist, tritt zurueck.
        const dimmed = status === 'out';
        const pct = target ? Math.max(0, Math.min(1, (p.score ?? 0) / target)) : 0;

        const rank = sort === 'score' && hasScores ? i + 1 : null;
        const showRank = rank !== null && (p.score ?? 0) > 0;

        return (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
            transition={{ layout: { type: 'spring', stiffness: 360, damping: 30 }, delay: Math.min(i * 0.04, 0.3) }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 ${isRail ? 'w-full' : ''}`}
            style={{
              background: isLeader ? `linear-gradient(120deg, ${p.color}1f, #140e24 60%)` : '#140e24',
              border: `1.5px solid ${isActive ? p.color : isLeader ? `${p.color}66` : 'rgba(255,255,255,0.08)'}`,
              // Immer explizit setzen: ein weggelassener Schluessel bliebe sonst stehen (Ring nach activeId=null).
              boxShadow: scoreChipShadow(isActive, isLeader, p.color),
            }}
          >
            {showRank && (
              <span
                className="shrink-0 font-black tabular-nums text-center"
                style={{ fontSize: tvType.label, width: '1.4em', color: rank === 1 ? '#FFD23F' : rank === 2 ? '#cfd3dc' : rank === 3 ? '#e0915b' : '#6b6480' }}
              >
                {rank}
              </span>
            )}
            <div className="relative shrink-0">
              {/* Dasselbe Gesicht wie im Wartebereich (Emoji aus der Teilnehmerliste). */}
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(4.4)} />
              {status === 'done' && (
                <span className="absolute -right-1 -bottom-1 grid place-items-center rounded-full font-black" style={{ width: lu(2), height: lu(2), fontSize: lu(1.4), background: '#8ff5ff', color: '#060810' }}>✓</span>
              )}
              {status === 'out' && (
                <span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center text-[11px]">💀</span>
              )}
            </div>

            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                {isLeader && <span style={{ fontSize: tvType.micro }}>👑</span>}
                <span className="font-bold text-white truncate" style={{ fontSize: lu(2.2) }}>{p.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {typeof p.score === 'number' && target ? (
                  <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full origin-left" style={{ background: p.color, transform: `scaleX(${pct})` }} />
                  </div>
                ) : null}
                <span className="font-bold tabular-nums whitespace-nowrap" style={{ fontSize: lu(2.2), color: '#c9bfdc' }}>
                  {typeof p.score === 'number' ? (target ? `${p.score}/${target}` : p.score) : ''}
                  {p.subtitle ? `${typeof p.score === 'number' ? ' · ' : ''}${p.subtitle}` : ''}
                </span>
                {typeof p.partyRank === 'number' && (
                  <span
                    className="inline-flex items-center gap-[0.2em] shrink-0 rounded-full px-[0.45em] py-[0.1em] font-black tabular-nums whitespace-nowrap"
                    style={{
                      fontSize: tvType.micro,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: p.partyRank === 1 ? '#FFD23F' : '#b3a8c9',
                    }}
                  >
                    <Trophy style={{ width: '1em', height: '1em' }} strokeWidth={2.5} />
                    {p.partyRank}
                    {typeof p.partyPoints === 'number' ? ` · ${p.partyPoints}` : ''}
                  </span>
                )}
              </div>
              {!!p.members?.length && (
                <button type="button" data-testid={`tv-team-members-${p.id}`}
                  aria-label={`${p.name}: ${p.members.join(', ')}`} aria-expanded={openTeamId === p.id}
                  onClick={() => setOpenTeamId(p.id)}
                  dir="auto" className="mt-1 flex max-w-full items-start gap-1 text-left hover:text-white focus-visible:outline focus-visible:outline-2"
                  style={{ fontSize: tvType.micro, color: '#b3a8c9', lineHeight: 1.2 }}>
                  <Users className="mt-px h-[1em] w-[1em] shrink-0" />
                  <span className="line-clamp-2 break-words">{p.members.join(' · ')}</span>
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
    {openTeam && (
      <div data-testid="tv-team-members-overlay" className="fixed inset-0 z-[100] flex items-center justify-center px-[6vw] py-[7vh]">
        <button type="button" onClick={() => setOpenTeamId(null)} aria-label="Close" className="absolute inset-0 bg-black/80" />
        <div role="dialog" aria-modal="true" aria-label={openTeam.name}
          className="relative z-10 flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/15 bg-[#140e24] p-[3vw] shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <h2 dir="auto" className="font-black" style={{ color: openTeam.color, fontSize: tvType.title }}>{openTeam.name}</h2>
            <button type="button" onClick={() => setOpenTeamId(null)} aria-label="Close" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white"><X /></button>
          </div>
          <div className="mt-5 grid max-h-full grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {openTeam.members?.map((name, index) => (
              <div key={`${name}-${index}`} dir="auto" className="rounded-xl bg-white/10 px-4 py-3 font-bold text-white" style={{ fontSize: tvType.body }}>{name}</div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

/** Memoized — a stable roster won't re-render on the TV's per-second tick. */
const TVScoreboard = memo(TVScoreboardImpl);
export default TVScoreboard;
