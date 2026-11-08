import type { HitAttempt, HitRoundHistory } from './engine';

interface Labels { round: string; history: string; correct: string; wrong: string; timeout: string; noAttempts: string }

export function HitBuzzerAttempts({ attempts, labels }: { attempts: HitAttempt[]; labels: Labels }) {
  if (!attempts.length) return <p className="text-sm text-[#a99cba]">{labels.noAttempts}</p>;
  return <ol className="space-y-2">{attempts.map((attempt, index) => <li key={`${attempt.playerId}-${index}`}
    className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.035] px-3 py-2.5 text-left">
    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${attempt.outcome === 'correct' ? 'bg-[#8ff5ff]/15 text-[#8ff5ff]' : 'bg-[#ff6b98]/15 text-[#ff8bad]'}`} aria-hidden="true">{attempt.outcome === 'correct' ? '✓' : '×'}</span>
    <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{attempt.playerName}</strong><span className="block text-xs text-[#a99cba]">{attempt.outcome === 'correct' ? labels.correct : attempt.outcome === 'timeout' ? labels.timeout : labels.wrong}{attempt.teamName ? ` · ${attempt.teamName}` : ''}</span></span>
    <strong className={`font-game text-sm tabular-nums ${attempt.delta > 0 ? 'text-[#8ff5ff]' : 'text-[#ff8bad]'}`}>{attempt.delta > 0 ? '+' : ''}{attempt.delta}</strong>
  </li>)}</ol>;
}

export function HitBuzzerRoundHistory({ history, labels, expanded }: { history: HitRoundHistory[]; labels: Labels; expanded: boolean }) {
  if (!history.length) return null;
  return <details key={`${history.length}-${expanded}`} open={expanded} className="rounded-[24px] border border-white/10 bg-[#0d0915] p-4 text-white sm:p-5">
    <summary className="cursor-pointer font-game text-base font-black marker:text-[#df8eff]">{labels.history} <span className="ml-2 text-sm text-[#b3a8c9]">{history.length}</span></summary>
    <div className="mt-4 space-y-3">{[...history].reverse().map(entry => <article key={entry.round} className="rounded-[20px] border border-white/[.07] bg-[#16101f] p-4">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#df8eff]">{labels.round} {entry.round}</p>
      <h3 className="mt-1 font-game text-lg font-black text-white">{entry.title}</h3>
      <p className="mb-3 text-sm text-[#b3a8c9]">{entry.artist}</p>
      <HitBuzzerAttempts attempts={entry.attempts} labels={labels} />
    </article>)}</div>
  </details>;
}
