/**
 * GuestGameFan — echte Spiel-Cover als Faecher statt eines Gamepad-Icons.
 *
 * WARUM: Ein generisches Icon sagt nichts darueber aus, was im Spiele-Tab
 * wirklich wartet. Fuenf echte Cover (allesamt Free-Tier, also ohne Konto
 * UND ohne Premium sofort spielbar) machen "21 Spiele, sofort startklar"
 * sichtbar statt nur behauptet. Rein dekorativ — der Text der Karte traegt
 * die zugaengliche Beschriftung, deshalb aria-hidden.
 */

interface FanGame {
  id: string;
  rotate: number;
  x: number;
}

const FAN_GAMES: FanGame[] = [
  { id: "pantomime", rotate: -14, x: -20 },
  { id: "headup", rotate: -6, x: -9 },
  { id: "bomb", rotate: 3, x: 3 },
  { id: "taboo", rotate: 10, x: 14 },
  { id: "pixeljagd", rotate: 17, x: 24 },
];

export function GuestGameFan({ className }: { className?: string }) {
  return (
    <div
      className={`relative h-16 w-24 shrink-0 ${className ?? ""}`}
      aria-hidden="true"
    >
      {FAN_GAMES.map((game, i) => (
        <img
          key={game.id}
          src={`/images/games/${game.id}.webp`}
          alt=""
          loading="lazy"
          className="absolute left-1/2 top-1/2 h-14 w-14 rounded-xl border-2 border-white/20 object-cover shadow-lg"
          style={{
            transform: `translate(-50%, -50%) translateX(${game.x}px) rotate(${game.rotate}deg)`,
            zIndex: i,
          }}
        />
      ))}
    </div>
  );
}
