/**
 * Der „← Zurück"-Verweis oben auf einem Setup-Bildschirm.
 *
 * Zeichnet sich selbst nur, wenn die Hülle keinen eigenen Zurück-Knopf stellt
 * (siehe `hasShellBackButton` in `./shell-back`) — die Spiele müssen die Regel
 * also nicht kennen. Fünf Spiele teilten sich exakt dieselbe Basis-Klasse;
 * unterschiedlich sind nur Außenabstand, Farbe und ob der Pfeil ein
 * `<ArrowLeft>` oder das Zeichen „←" ist. Genau das kommt über `className`,
 * `style` und `children` herein, damit kein Spiel anders aussieht als vorher.
 *
 * Absichtlich NICHT hier: die vollbreiten Text-Verweise (quickdraw, sharedquiz)
 * und der absolut positionierte Icon-Knopf (splitquiz) — andere Form, die
 * würden hier nur als Sonderfälle wieder auseinanderlaufen.
 */
import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hasShellBackButton } from "./shell-back";

interface GameSetupBackLinkProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

export function GameSetupBackLink({
  onClick,
  children,
  className,
  style,
  ...rest
}: GameSetupBackLinkProps) {
  if (hasShellBackButton()) return null;
  return (
    <button
      onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 text-xs font-bold", className)}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
