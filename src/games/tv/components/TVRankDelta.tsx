import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { tvType } from '../tv-tokens';

/**
 * TVRankDelta — "▲2 / ▼1 / –" versus the previous game, as lucide glyphs.
 *
 * Renders nothing while `prevRank` is null (nothing has finished yet), so the
 * very first standings screen stays clean instead of showing a row of dashes.
 */
interface Props {
  rank: number;
  prevRank: number | null | undefined;
  /** font size token; the icon scales with it via 1em */
  size?: string;
}

export default function TVRankDelta({ rank, prevRank, size = tvType.micro }: Props) {
  if (prevRank === null || prevRank === undefined) return null;

  const delta = prevRank - rank; // positive = climbed
  const Icon = delta > 0 ? ChevronUp : delta < 0 ? ChevronDown : Minus;
  const color = delta > 0 ? '#26E0C4' : delta < 0 ? '#ff6b98' : '#6b6480';

  return (
    <span
      className="inline-flex items-center gap-[0.1em] font-black tabular-nums shrink-0"
      style={{ fontSize: size, color }}
    >
      <Icon style={{ width: '1em', height: '1em' }} strokeWidth={3} />
      {delta !== 0 ? Math.abs(delta) : null}
    </span>
  );
}
