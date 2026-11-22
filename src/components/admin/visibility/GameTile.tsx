import { useTranslation } from "react-i18next";
import { EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { PlayableGame } from "@/lib/playable-games";

interface Props {
  game: PlayableGame;
  hidden: boolean;
  onToggle: (visible: boolean) => void;
}

/**
 * One game: the artwork IS the card and carries the state (dimmed, grey and
 * marked while hidden), so the grid reads at a glance. The whole tile is the
 * touch target; the switch is the keyboard and screen-reader control.
 */
export function GameTile({ game, hidden, onToggle }: Props) {
  const { t } = useTranslation();
  const name = t(game.nameKey);
  const switchId = `game-switch-${game.id}`;

  return (
    <label
      htmlFor={switchId}
      className={cn(
        "group block cursor-pointer overflow-hidden rounded-2xl border bg-card transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={game.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200 motion-reduce:transition-none",
            hidden && "opacity-35 grayscale",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-background/90 text-foreground shadow-sm",
            "transition-[opacity,transform] duration-200 motion-reduce:transition-none",
            hidden ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        >
          <EyeOff className="h-5 w-5" />
        </span>
      </div>

      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className={cn("line-clamp-2 break-words text-sm font-semibold leading-tight", hidden && "text-muted-foreground")}>{name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {game.tier === "premium" ? t("admin.visibility.games.premium", "Premium") : t("admin.visibility.games.free", "Free")}
            {hidden && <> · {t("admin.visibility.hidden", "Ausgeblendet")}</>}
          </p>
        </div>
        <Switch
          id={switchId}
          checked={!hidden}
          onCheckedChange={onToggle}
          aria-label={hidden
            ? t("admin.visibility.games.showLabel", "Spiel {{name}} einblenden", { name })
            : t("admin.visibility.games.hideLabel", "Spiel {{name}} ausblenden", { name })}
          className="shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </label>
  );
}

/** Same box as `GameTile`, so nothing jumps when the real grid arrives. */
export function GameTileSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
