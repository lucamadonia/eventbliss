import { Shuffle } from 'lucide-react';

export interface FormationTeam {
  id: string;
  name: string;
  color: string;
  members: { id: string; name: string }[];
}

/** The same visible, tap-to-move team board used before a party game starts. */
export function TeamFormation({ teams, title, hint, shuffleLabel, emptyLabel, renameLabel, onShuffle, onMove, onRename, surface, elevated, text, muted }: {
  teams: FormationTeam[];
  title: string;
  hint: string;
  shuffleLabel: string;
  emptyLabel: string;
  renameLabel: (index: number) => string;
  onShuffle: () => void;
  onMove: (memberId: string) => void;
  onRename: (index: number, name: string) => void;
  surface: string;
  elevated: string;
  text: string;
  muted: string;
}) {
  return (
    <div data-testid="team-formation">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide" style={{ color: muted }}>{title}</p>
        <button type="button" onClick={onShuffle} data-testid="team-formation-shuffle" className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold"
          style={{ background: surface, color: text }}>
          <Shuffle className="h-4 w-4" /> {shuffleLabel}
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {teams.map((team, index) => (
          <div key={team.id} data-testid={`formation-team-${index}`} className="min-w-0 rounded-2xl p-3" style={{ background: surface }}>
            <input value={team.name} maxLength={20} onChange={(event) => onRename(index, event.target.value)}
              aria-label={renameLabel(index)} className="w-full min-h-10 rounded-lg border border-white/10 bg-transparent px-2 text-xs font-black focus:outline-none focus:ring-2"
              style={{ color: team.color, borderColor: `${team.color}55`, ['--tw-ring-color' as string]: team.color }} />
            <div className="mt-2 flex flex-col gap-1">
              {team.members.length === 0 && <span className="px-2 py-1.5 text-xs" style={{ color: muted }}>{emptyLabel}</span>}
              {team.members.map((member) => (
                <button key={member.id} type="button" onClick={() => onMove(member.id)}
                  data-testid={`formation-member-${member.id}`}
                  className="min-h-10 truncate rounded-lg px-2 py-1.5 text-left text-sm font-bold"
                  style={{ background: elevated, color: text }} title={hint}>
                  {member.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs" style={{ color: muted }}>{hint}</p>
    </div>
  );
}
