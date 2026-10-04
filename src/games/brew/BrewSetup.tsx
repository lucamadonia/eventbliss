/**
 * Aufbau von GEBRÄU (aus BrewGame ausgelagert).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FlaskConical, Martini } from "lucide-react";
import { PlayerSetup, type PlayerSetupPlayer } from "../ui/PlayerSetup";
import { useInitialRoster } from "../ui/useInitialRoster";
import { GameSetupBackLink } from "../ui/GameSetupBackLink";
import { BrewAtmosphere } from "./BrewAtmosphere";
import { BREW_PALETTES } from "./brew-palette";
import type { RecipeLength, Skin } from "./brew-content";

export function BrewSetup({ onStart, skin, onlinePlayers }: {
  onStart: (cfg: { players: { id: string; name: string }[]; length: RecipeLength }) => void;
  skin: Skin;
  onlinePlayers?: { id: string; name: string }[];
}) {
  const { t } = useTranslation();
  const theme = BREW_PALETTES[skin];
  const navigate = useNavigate();
  // Party-Besetzung übernehmen, statt mit zwei leeren Platzhaltern zu starten.
  const roster = useInitialRoster({ onlinePlayers, min: 2 });

  // Online sind die Namen gesetzt und die IDs muessen die des Raums sein —
  // nur dann trifft `active.id === myPlayerId` und die Zugerkennung greift.
  // Der Raum laesst 12 Leute zu, GEBRAEU spielt sich zu acht: abschneiden.
  const [list, setList] = useState<PlayerSetupPlayer[]>(
    onlinePlayers?.length
      ? onlinePlayers.slice(0, 8).map((p) => ({ id: p.id, name: p.name, readOnly: true }))
      : roster?.map((p) => ({ id: p.id, name: p.name })) ?? [{ id: "p1", name: "" }, { id: "p2", name: "" }],
  );
  const [length, setLength] = useState<RecipeLength>(5);

  const isBrew = skin === "brew";
  const accent = theme.accent;

  const named = list.map((p, i) => ({
    id: p.id,
    name: p.name.trim() || t("games.setup.playerN", { n: i + 1 }),
  }));
  const canStart = named.length >= 2;

  return (
    <div className="min-h-[100dvh] relative" style={{ background: theme.bg, color: theme.text }}>
      <BrewAtmosphere skin={skin} variant="phone" />
      <main className="relative z-10 pt-14 px-5 max-w-2xl mx-auto pb-16">
        <GameSetupBackLink onClick={() => navigate("/games")} className="mb-5" style={{ color: theme.dim }}>
          ← {t("games.brew.backToGames")}
        </GameSetupBackLink>

        <h1 className="text-3xl font-black flex items-center gap-2">
          {isBrew
            ? <FlaskConical className="w-7 h-7" style={{ color: accent }} />
            : <Martini className="w-7 h-7" style={{ color: accent }} />}
          {isBrew ? t("games.brew.titleBrew") : t("games.brew.titleBar")}
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.dim }}>
          {isBrew ? t("games.brew.taglineBrew") : t("games.brew.taglineBar")}
        </p>

        <div className="mt-6">
          <PlayerSetup
            players={list}
            onAdd={() => setList((p) => [...p, { id: `p${Date.now()}`, name: "" }])}
            onRemove={(id) => setList((p) => p.filter((x) => x.id !== id))}
            onRename={(id, name) => setList((p) => p.map((x) => (x.id === id ? { ...x, name } : x)))}
            min={2}
            max={8}
            accent={accent}
            label={t("games.brew.playersLabel")}
            onImportNames={(names) =>
              setList((prev) => {
                const room = Math.max(0, 8 - prev.length);
                const fresh = names.slice(0, room).map((n, i) => ({ id: `ev${Date.now()}-${i}`, name: n }));
                const filled = prev.map((p) => p);
                let take = 0;
                for (let i = 0; i < filled.length && take < fresh.length; i++) {
                  if (!filled[i].name.trim() && !filled[i].readOnly) {
                    filled[i] = { ...filled[i], name: fresh[take].name };
                    take++;
                  }
                }
                return [...filled, ...fresh.slice(take)].slice(0, 8);
              })
            }
          />
        </div>

        <p className="mt-7 mb-2 text-[13px] font-black" style={{ color: theme.dim }}>
          {t("games.brew.ingredientCountLabel")}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([5, 6, 7] as const).map((n) => (
            <button
              key={n}
              onClick={() => setLength(n)}
              aria-pressed={length === n}
              className="p-3 rounded-2xl text-sm font-black"
              style={{
                background: length === n ? accent : theme.surface,
                color: length === n ? theme.bg : theme.text,
              }}
            >
              {t("games.brew.ingredientCountOption", { count: n })}
            </button>
          ))}
        </div>

        <button
          disabled={!canStart}
          onClick={() => onStart({ players: named, length })}
          className="mt-8 w-full h-14 rounded-2xl font-black disabled:opacity-40"
          style={{ background: accent, color: theme.bg }}
        >
          {t("games.brew.start")}
        </button>
      </main>
    </div>
  );
}
