/**
 * BottleSVG — premium spin-the-bottle bottle, drawn as SVG so it looks identical
 * and high-quality on every platform (the old 🍾 emoji rendered differently per OS).
 *
 * The neck/cork points UP (0° = top). The game rotates a wrapper around this, and
 * the existing target math (neck at 0° → player 0) stays valid. A glowing tip at
 * the cork acts as the pointer toward the chosen player.
 */
interface BottleSVGProps {
  /** Rendered width/height in px. */
  size?: number;
  /** Neon glow colour for the pointer tip (usually the brand violet or a player colour). */
  glowColor?: string;
}

export function BottleSVG({ size = 132, glowColor = "#df8eff" }: BottleSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bsv-glass" x1="30" y1="20" x2="72" y2="122" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1f7a4d" />
          <stop offset="0.5" stopColor="#15663f" />
          <stop offset="1" stopColor="#0c4329" />
        </linearGradient>
        <linearGradient id="bsv-cork" x1="42" y1="8" x2="58" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6d479" />
          <stop offset="1" stopColor="#c89534" />
        </linearGradient>
        <filter id="bsv-shadow" x="-40%" y="-20%" width="180%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <filter id="bsv-tipglow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* Pointer glow at the cork tip */}
      <circle cx="50" cy="9" r="7" fill={glowColor} opacity="0.85" filter="url(#bsv-tipglow)" />

      <g filter="url(#bsv-shadow)">
        {/* Bottle body: neck → shoulder → rounded base */}
        <path
          d="M43,25 L43,42 C43,48 27,52 27,70 L27,112 Q27,122 37,122 L63,122 Q73,122 73,112 L73,70 C73,52 57,48 57,42 L57,25 Z"
          fill="url(#bsv-glass)"
          stroke="#0a3320"
          strokeWidth="1.2"
        />
        {/* Subtle label band */}
        <rect x="28" y="84" width="44" height="24" rx="2.5" fill="#fbfbf4" opacity="0.92" />
        <rect x="28" y="84" width="44" height="24" rx="2.5" fill="url(#bsv-glass)" opacity="0.06" />
        <line x1="34" y1="92" x2="66" y2="92" stroke="#15663f" strokeWidth="1.4" opacity="0.5" />
        <line x1="34" y1="100" x2="60" y2="100" stroke="#15663f" strokeWidth="1.2" opacity="0.3" />
        {/* Glass highlight streak */}
        <rect x="34" y="58" width="5" height="56" rx="2.5" fill="#ffffff" opacity="0.22" />
        <rect x="46" y="28" width="3" height="14" rx="1.5" fill="#ffffff" opacity="0.18" />
        {/* Foil ring */}
        <rect x="42" y="24" width="16" height="5" rx="1" fill="url(#bsv-cork)" />
        {/* Cork */}
        <rect x="42.5" y="9" width="15" height="17" rx="3.5" fill="url(#bsv-cork)" stroke="#a87a28" strokeWidth="0.8" />
        <rect x="45" y="11" width="3" height="13" rx="1.5" fill="#ffffff" opacity="0.25" />
      </g>
    </svg>
  );
}
