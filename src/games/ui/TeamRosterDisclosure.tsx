import { useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';

export interface RosterTeam {
  id: string;
  name: string;
  color: string;
  score: number;
  memberNames: readonly string[];
}

/** Compact team scores; tap a team to see its current members. */
export function TeamRosterDisclosure({ teams, surface, text, muted, pointsLabel }: {
  teams: RosterTeam[];
  surface: string;
  text: string;
  muted: string;
  pointsLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!teams.length) return null;
  const selected = teams.find((team) => team.id === openId);
  return (
    <div className="relative z-10 px-4 pt-3" data-testid="team-roster-disclosure">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {teams.map((team) => (
          <button type="button" key={team.id} onClick={() => setOpenId((current) => current === team.id ? null : team.id)}
            aria-expanded={openId === team.id} aria-label={`${team.name}: ${team.memberNames.join(', ')}`}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-left text-xs font-bold"
            style={{ background: surface, color: text, border: `1px solid ${openId === team.id ? team.color : `${team.color}55`}` }}>
            <Users className="h-4 w-4 shrink-0" style={{ color: team.color }} />
            <span dir="auto" className="max-w-32 truncate">{team.name}</span>
            <span className="tabular-nums" style={{ color: team.color }}>{team.score} {pointsLabel}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openId === team.id ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>
      {selected && (
        <div role="region" aria-label={selected.name} className="mt-1 rounded-xl px-3 py-2 text-xs leading-relaxed"
          style={{ background: surface, color: muted, borderLeft: `3px solid ${selected.color}` }}>
          <strong dir="auto" style={{ color: text }}>{selected.name}:</strong> {selected.memberNames.join(' · ')}
        </div>
      )}
    </div>
  );
}
