import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Glass } from '@/games/brew/Glass';
import { IngredientCard } from '@/games/brew/IngredientCard';
import { brewRadius, type BrewPalette } from '@/games/brew/brew-palette';
import { shapeForRecipe } from '@/games/brew/glass-shapes';
import { INGREDIENTS, recipeKey, type IngredientId, type Skin } from '@/games/brew/brew-content';
import { tvPanel, tvType } from '../../tv-tokens';
import { lu } from '../../components/tv-lobby-scale';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';

export interface BrewPlayerState {
  id: string;
  name: string;
  color: string | null;
  avatar: string | null;
  score: number;
  glass: string[];
  recipe: string[];
  recipeId: string;
  have: number;
  done: boolean;
  brewBonus: number;
}

export function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Typ-Wache: nur Kennungen, die `INGREDIENTS` wirklich kennt, duerfen weiter —
 * sonst wirft ein Zugriff auf `undefined` und reisst die ganze Ansicht mit. */
export function isKnownIngredient(id: string): id is IngredientId {
  return Object.prototype.hasOwnProperty.call(INGREDIENTS, id);
}

/**
 * `Glass` sortiert selbst nicht — Index 0 in `filled` zeichnet es ganz unten
 * und geht davon aus, dass dort die Basis-Zutat steht. Kommt der tv-state
 * anders sortiert an, wuerde die Basis mitten im Glas schweben.
 */
function withBaseFirst(ids: IngredientId[]): IngredientId[] {
  const baseIdx = ids.findIndex((id) => INGREDIENTS[id].isBase);
  if (baseIdx <= 0) return ids;
  return [ids[baseIdx], ...ids.slice(0, baseIdx), ...ids.slice(baseIdx + 1)];
}

/**
 * Eine Spalte der Spielerreihe: Symbol + Name + Punkte, Glas, Fortschritt,
 * Rezept. Aus TVBrewView ausgelagert (Dateigroesse); Aussehen unveraendert,
 * nur Identitaet (TVPlayerAvatar) und Lesbarkeit auf 3 m angehoben.
 */
export function BrewPlayerColumn({ pl, color, isActive, skin, palette: p, compact, chainLevel, arrivalDelay, reduce }: {
  pl: BrewPlayerState; color: string; isActive: boolean; skin: Skin; palette: BrewPalette;
  compact: boolean; chainLevel: number; arrivalDelay: number; reduce: boolean;
}) {
  const { t } = useTranslation();
  const knownGlass = pl.glass.filter(isKnownIngredient);
  const anteil = pl.recipe.length > 0 ? pl.have / pl.recipe.length : 0;
  const form = shapeForRecipe(pl.recipeId, skin);
  return (
  <div
    className={`${tvPanel} flex flex-col items-center gap-[0.5vh] p-[0.9vh] min-w-0 overflow-hidden`}
    style={{
      background: isActive ? p.surfaceRaised : p.surface,
      borderRadius: brewRadius.xl,
      boxShadow: isActive ? `0 0 0 2px ${color}, 0 0 40px -8px ${color}` : undefined,
    }}
  >
    {/* Kopf: Name links, Punkte rechts. */}
    <div className="flex items-center justify-between w-full gap-[0.5vw] px-[0.2vw]">
      <div className="flex items-center gap-[0.5vw] min-w-0">
        <TVPlayerAvatar id={pl.id || undefined} name={pl.name} avatar={pl.avatar ?? undefined} color={color}
          size={compact ? lu(3.6) : lu(4.4)} active={isActive} />
        <span className="font-bold truncate" style={{ fontSize: tvType.body, color: p.text }}>
          {pl.name}
        </span>
      </div>
      <span className="font-black tabular-nums shrink-0" style={{ fontSize: tvType.body, color: p.text }}>
        {pl.score}
      </span>
    </div>

    {/* Glasbuehne: Ring HINTER dem Glas, Glas darauf. */}
    <div className="relative flex-1 min-h-0 w-full flex items-end justify-center">
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: '6%', left: '50%', width: '88%', aspectRatio: '1 / 1',
          x: '-50%',
          background: `radial-gradient(circle, ${color}55 0%, ${color}18 42%, transparent 68%)`,
        }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      />
      <Glass
        recipeNeeds={pl.recipe as IngredientId[]}
        filled={withBaseFirst(knownGlass)}
        skin={skin}
        shape={form}
        palette={p}
        width={skin === 'brew' ? (compact ? 'clamp(56px, 7.4vw, 132px)' : 'clamp(56px, 8.6vw, 172px)') : undefined}
        height={skin === 'bar'
          ? (compact ? 'min(18vh, 150px)' : 'min(26vh, 240px)')
          : undefined}
        className="relative"
        quality="tv"
        active={isActive}
        intensity={isActive ? (chainLevel as 0 | 1 | 2 | 3) : 0}
        // Bei vielen Spielern bekommen die nicht-aktiven keinen Versatz mehr.
        arrivalDelay={arrivalDelay}
        layerStagger={compact && !isActive ? 0 : 70}
      />
    </div>

    {/* Fortschritt: `scaleX` statt `width` — Hausregel
        transform/opacity, sonst rechnet der Browser Layout. */}
    <div className="w-full px-[0.2vw]">
      <div className="flex justify-end">
      <span className="font-semibold tabular-nums" style={{ fontSize: tvType.label, color: isActive ? p.text : p.dim }}>
          {pl.have}/{pl.recipe.length}{pl.brewBonus > 0 ? ` · ✦${pl.brewBonus}` : ''}
        </span>
      </div>
      <div style={{ height: 'clamp(6px,0.6vh,10px)', borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          style={{
            height: '100%', width: '100%', transformOrigin: 'left',
            background: `linear-gradient(90deg, ${color}, ${p.accent2})`,
            boxShadow: `0 0 14px -2px ${color}`,
          }}
          initial={false}
          animate={{ scaleX: anteil }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 18 }}
        />
      </div>
    </div>

    {/* Rezept als echte Karten — vorher rohe Emoji auf Vollfarbe,
        auf der bei hellen Zutaten nichts mehr zu erkennen war. */}
    <div className="flex flex-wrap justify-center gap-[0.25vw]" style={{ maxWidth: '100%' }}>
      {pl.recipe.filter(isKnownIngredient).map((id, ri) => (
        <IngredientCard
          key={`${id}-${ri}`}
          id={id}
          skin={skin}
          variant="chip"
          palette={p}
          state={pl.glass.includes(id) ? 'owned' : 'muted'}
        />
      ))}
    </div>

    {/* Rezeptname — `recipeId` kam schon immer im Payload an und
        wurde bisher nicht gelesen. */}
    <span className="truncate w-full text-center" style={{ fontSize: tvType.label, color: p.dim }}>
      {pl.recipeId ? t(recipeKey(pl.recipeId, skin)) : ''}
      {pl.done ? ` · ${t('games.brew.tv.done')}` : ''}
    </span>
  </div>
);
}
