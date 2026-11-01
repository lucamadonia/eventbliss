import { ArrowRight, Disc3, RefreshCw } from 'lucide-react';
import { StageAction } from '../ui/GameStage';
import './hit-buzzer-round.css';

interface RoundIntroProps {
  round: number;
  total: number;
  isHost: boolean;
  loading: boolean;
  ready: boolean;
  failed: boolean;
  labels: {
    round: string;
    startNow: string;
    otherSong: string;
    ready: string;
    finding: string;
    unavailable: string;
    waiting: string;
    challenge: string;
    promise: string;
  };
  onStart: () => void;
  onReplace: () => void;
}

export function HitBuzzerRoundIntro({ round, total, isHost, loading, ready, failed, labels, onStart, onReplace }: RoundIntroProps) {
  const status = !isHost ? labels.waiting : loading ? labels.finding : ready && !failed ? labels.ready : labels.unavailable;

  return <section className="hit-round-intro" aria-label={`${labels.round} ${round}`}>
    <div className="hit-round-intro__topline">
      <span className="hit-round-intro__round">{labels.round} {String(round).padStart(2, '0')} <span>/ {String(total).padStart(2, '0')}</span></span>
      <span className={`hit-round-intro__status ${ready && !failed ? 'hit-round-intro__status--ready' : ''}`}>
        <span className="hit-round-intro__status-light" />{status}
      </span>
    </div>

    <div className="hit-round-intro__art" aria-hidden="true">
      <div className="hit-round-intro__halo hit-round-intro__halo--outer" />
      <div className="hit-round-intro__halo hit-round-intro__halo--inner" />
      <div className="hit-round-intro__bars hit-round-intro__bars--left"><i /><i /><i /><i /><i /></div>
      <div className="hit-round-intro__bars hit-round-intro__bars--right"><i /><i /><i /><i /><i /></div>
      <div className="hit-round-intro__buzzer"><div className="hit-round-intro__buzzer-well"><div className="hit-round-intro__buzzer-face"><span /></div></div></div>
      <Disc3 className="hit-round-intro__disc" />
    </div>

    <div className="hit-round-intro__copy">
      <p className="hit-round-intro__eyebrow">HIT-BUZZER</p>
      <h2>{labels.challenge}</h2>
      <p>{labels.promise}</p>
    </div>

    {isHost && <div className="hit-round-intro__actions">
      <StageAction onClick={onStart} disabled={!ready || loading} className="hit-round-intro__start">
        {labels.startNow}<ArrowRight className="h-5 w-5" />
      </StageAction>
      {(!ready && !loading || failed) && <StageAction variant="secondary" onClick={onReplace} className="hit-round-intro__replace">
        <RefreshCw className="h-4 w-4" />{labels.otherSong}
      </StageAction>}
    </div>}
  </section>;
}
