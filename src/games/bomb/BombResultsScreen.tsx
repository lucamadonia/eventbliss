import { useTranslation } from 'react-i18next';
import { RotateCcw, Share2, ShieldCheck } from 'lucide-react';
import { GameStage, StageHeader, StagePanel, StageAction, StageFooter } from '../ui/GameStage';
import { hasShellBackButton } from '../ui/shell-back';
import { SeatAvatar } from '@/components/native/party/PartySheet';
import { useSeatAvatar } from '../ui/PartyTurnRibbon';
import type { GameState } from './BombGame';
import { bombRanks } from './rules';
import './bomb-console.css';
import './bomb-presentation.css';

/** Party: symbol/colour per seat (same order as state.players) and whether this device may advance. */
export interface BombPartyView {
  seats?: { id: string; avatar?: string; color?: string }[];
  /** Only the host advances; everyone else sees a calm note instead of a dead button. */
  canAdvance?: boolean;
}

const MEDALS = ['#f5c542', '#c9d1dc', '#d08a52'];


function Standings({ state, seats }: { state: GameState; seats?: BombPartyView['seats'] }) {
  const { t } = useTranslation();
  const seatAvatar = useSeatAvatar();
  const rows = state.players.map((p, i) => ({ p, seat: seats?.[i] })).sort((a, b) => a.p.penalties - b.p.penalties);
  const ranks = bombRanks(rows.map(r => r.p.penalties));
  return <div className="bomb-ledger">{rows.map(({ p, seat }, i) => {
    const rank = ranks[i];
    return <div key={seat?.id ?? i} className="bomb-ledger-row" data-winner={rank === 1}>
      <span className="bomb-rank" style={rank <= 3 ? { color: MEDALS[rank - 1] } : undefined}>{rank}</span>
      <strong className="bomb-ledger-name">
        {seat && <SeatAvatar avatar={seatAvatar(seat.avatar, seat.id)} color={seat.color || '#df8eff'} size={32} />}
        <bdi>{p.name}</bdi>
      </strong>
      <span>{p.penalties === 0 ? <ShieldCheck size={20} /> : p.penalties}<small>{t(p.penalties === 0 ? 'games.bomb.safe' : 'games.bomb.hits')}</small></span>
    </div>;
  })}</div>;
}

function HostNote({ text }: { text: string }) {
  return <p role="status" data-testid="bomb-wait-host" className="bomb-wait-host">{text}</p>;
}

export function BombRoundEndScreen({ state, onNext, seats, canAdvance = true }: { state: GameState; onNext: () => void } & BombPartyView) {
  const { t } = useTranslation();
  const next = state.round + 1;
  return <GameStage gameId="bomb" className="bomb-console"><StageHeader title={t('games.bomb.interimStandings')} eyebrow={t('games.bomb.name')} progress={{ value: state.round, total: state.totalRounds }} />
    <StagePanel className="bomb-report"><Standings state={state} seats={seats} /><StageFooter>
      {canAdvance
        ? <StageAction onClick={onNext}>{t('games.bomb.startRound', { round: next })}</StageAction>
        : <HostNote text={t('games.bomb.hostStartsRound', 'Der Host startet gleich Runde {{round}} …', { round: next })} />}
    </StageFooter></StagePanel>
  </GameStage>;
}

export default function BombResultsScreen({ state, onRestart, onExit, seats, canAdvance = true }: { state: GameState; onRestart: () => void; onExit: () => void } & BombPartyView) {
  const { t } = useTranslation();
  const sorted = [...state.players].sort((a, b) => a.penalties - b.penalties);
  const winners = sorted.filter(p => p.penalties === sorted[0]?.penalties).map(p => p.name).join(' / ');
  const share = () => { const title = t('games.bomb.name'); const text = sorted.map(p => `${p.name}: ${p.penalties} ${t('games.bomb.hits')}`).join('\n'); if (navigator.share) void navigator.share({ title, text }); else void navigator.clipboard?.writeText(text); };
  return <GameStage gameId="bomb" className="bomb-console"><StageHeader title={t('games.bomb.congrats')} eyebrow={t('games.bomb.name')} subtitle={winners} />
    <div className="bomb-report"><div className="bomb-report-facts"><div><strong>{state.totalRounds}</strong><span>{t('games.bomb.roundsPlayed')}</span></div><div><strong>{state.players.length}</strong><span>{t('games.bomb.players')}</span></div><div><ShieldCheck size={26} /><span>{t('games.bomb.fewestPenalties')}</span></div></div>
      <Standings state={state} seats={seats} /><StageFooter>
        {canAdvance
          ? <><StageAction onClick={onRestart}><RotateCcw size={19} />{t('games.results.playAgain')}</StageAction>{!hasShellBackButton() && <StageAction variant="secondary" onClick={onExit}>{t('games.results.otherGame')}</StageAction>}</>
          : <HostNote text={t('games.bomb.hostDecidesNext', 'Der Host entscheidet, wie es weitergeht …')} />}
        <StageAction variant="ghost" onClick={share} aria-label={t('common.share')}><Share2 size={20} /></StageAction>
      </StageFooter></div>
  </GameStage>;
}
