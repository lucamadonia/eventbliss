import './hit-buzzer-button.css';

interface HitBuzzerButtonProps {
  name: string;
  score: number;
  pointsLabel: string;
  buzzLabel: string;
  lockedLabel: string;
  sentLabel: string;
  answerLabel: string;
  locked: boolean;
  pending: boolean;
  claimed: boolean;
  disabled: boolean;
  large: boolean;
  onClick: () => void;
}

export function HitBuzzerButton({ name, score, pointsLabel, buzzLabel, lockedLabel, sentLabel, answerLabel, locked, pending, claimed, disabled, large, onClick }: HitBuzzerButtonProps) {
  const status = locked ? lockedLabel : claimed ? answerLabel : pending ? sentLabel : buzzLabel;
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={`${buzzLabel}: ${name}`}
    className={`hit-buzzer-button ${large ? 'hit-buzzer-button--large' : ''} ${claimed || pending ? 'hit-buzzer-button--pressed' : ''} ${locked ? 'hit-buzzer-button--locked' : ''}`}>
    <span className="hit-buzzer-button__hardware" aria-hidden="true">
      <span className="hit-buzzer-button__well">
        <span className="hit-buzzer-button__plunger"><span className="hit-buzzer-button__shine" /></span>
      </span>
    </span>
    <span className="hit-buzzer-button__name">{name}</span>
    <span className="hit-buzzer-button__status">{status} <span aria-hidden="true">·</span> {score} {pointsLabel}</span>
  </button>;
}
