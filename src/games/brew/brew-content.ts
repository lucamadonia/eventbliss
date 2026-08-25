/**
 * GEBRAEU — Zutaten und Rezepte.
 *
 * ZWEI GEWAENDER, EINE MECHANIK: Standard ist ein Zaubertrank, mit
 * eingeschaltetem Trinkmodus werden Cocktails daraus. Kennungen, Farben und
 * Rezeptstruktur sind IDENTISCH — nur Emoji und Name wechseln. Zwei getrennte
 * Datensaetze waeren zwei Wahrheiten, die auseinanderlaufen.
 *
 * KEINE NAMEN IN DIESER DATEI: Zutaten- und Rezeptnamen stehen in den
 * Sprachdateien unter `games.brew.*`. Sonst stuenden sie in allen zehn
 * Sprachen deutsch da — genau der Fehler, den `dead-keys.test.ts` heute schon
 * viermal gefunden hat.
 *
 * Die Farbe gehoert zur ZUTAT, nicht zur Darstellung: Auf dem Fernseher fuellt
 * sich das Glas schichtweise in genau diesen Farben.
 */

export type IngredientId =
  | "base1" | "base2" | "base3" | "base4"
  | "sour" | "sweetFruit" | "redFruit" | "exotic"
  | "herb" | "sugar" | "fizz" | "bitterHerb"
  | "cold" | "bitter" | "creamy" | "topping";

export interface Ingredient {
  id: IngredientId;
  /** Schichtfarbe im Glas — traegt beide Gewaender. */
  color: string;
  /** Emoji im Cocktail-Gewand. */
  bar: string;
  /** Emoji im Zaubertrank-Gewand. */
  brew: string;
  /** true = Basis; sie liegt immer unten im Glas. */
  isBase?: boolean;
}

export const INGREDIENTS: Record<IngredientId, Ingredient> = {
  base1:      { id: "base1",      color: "#C98B4B", bar: "🥃", brew: "🩸", isBase: true },
  base2:      { id: "base2",      color: "#BFD9E8", bar: "🍸", brew: "🌙", isBase: true },
  base3:      { id: "base3",      color: "#E3D18A", bar: "🌵", brew: "🦴", isBase: true },
  base4:      { id: "base4",      color: "#E8EEF5", bar: "❄️", brew: "💎", isBase: true },
  sour:       { id: "sour",       color: "#9BD645", bar: "🍋", brew: "🧪" },
  sweetFruit: { id: "sweetFruit", color: "#FF9F2E", bar: "🍊", brew: "🔥" },
  redFruit:   { id: "redFruit",   color: "#D6274B", bar: "🔴", brew: "🍄" },
  exotic:     { id: "exotic",     color: "#FFC244", bar: "🥭", brew: "⚡" },
  herb:       { id: "herb",       color: "#3FBF7F", bar: "🌿", brew: "🌱" },
  sugar:      { id: "sugar",      color: "#F3E7D3", bar: "🍬", brew: "✨" },
  fizz:       { id: "fizz",       color: "#CFE9F5", bar: "💧", brew: "💨" },
  bitterHerb: { id: "bitterHerb", color: "#DCEFF7", bar: "🫧", brew: "🕸️" },
  cold:       { id: "cold",       color: "#BBE3F2", bar: "🧊", brew: "🧿" },
  bitter:     { id: "bitter",     color: "#8B3A2E", bar: "🌰", brew: "🪶" },
  creamy:     { id: "creamy",     color: "#F7F1E4", bar: "🥥", brew: "🐚" },
  topping:    { id: "topping",    color: "#C0233E", bar: "🍒", brew: "👁️" },
};

export interface RecipeBlueprint {
  id: string;
  /** Genau so viele Zutaten, wie die Stufe verlangt. Basis an erster Stelle. */
  needs: IngredientId[];
}

/**
 * WARUM NACH LAENGE GETRENNT und nicht ein Rezept gestreckt:
 * Ein Mojito bleibt ein Mojito. Ihn auf sieben Zutaten aufzublasen waere
 * gelogen, ihn auf fuenf zu kuerzen genauso. Die im Setup gewaehlte Laenge
 * waehlt deshalb ein ANDERES Getraenk — kurze, mittlere oder aufwendige.
 *
 * MINDESTENS ACHT je Stufe, damit auch bei acht Spielern jeder ein eigenes
 * Rezept bekommt. `brew-content.test.ts` prueft das.
 */
export const RECIPES_BY_LENGTH: Record<5 | 6 | 7, RecipeBlueprint[]> = {
  5: [
    { id: "s1", needs: ["base2", "bitterHerb", "sour", "cold", "topping"] },
    { id: "s2", needs: ["base1", "redFruit", "sour", "cold", "sugar"] },
    { id: "s3", needs: ["base3", "sweetFruit", "sour", "cold", "sugar"] },
    { id: "s4", needs: ["base4", "redFruit", "sweetFruit", "cold", "sour"] },
    { id: "s5", needs: ["base1", "herb", "sour", "sugar", "fizz"] },
    { id: "s6", needs: ["base2", "bitter", "sweetFruit", "cold", "topping"] },
    { id: "s7", needs: ["base3", "exotic", "sour", "sugar", "cold"] },
    { id: "s8", needs: ["base4", "fizz", "sour", "cold", "herb"] },
    { id: "s9", needs: ["base1", "creamy", "exotic", "sugar", "cold"] },
    { id: "s10", needs: ["base2", "sour", "sugar", "fizz", "topping"] },
  ],
  6: [
    { id: "m1", needs: ["base1", "sour", "herb", "sugar", "fizz", "cold"] },
    { id: "m2", needs: ["base3", "sour", "sugar", "cold", "sweetFruit", "topping"] },
    { id: "m3", needs: ["base4", "redFruit", "sour", "cold", "sugar", "sweetFruit"] },
    { id: "m4", needs: ["base2", "sweetFruit", "fizz", "cold", "bitter", "topping"] },
    { id: "m5", needs: ["base1", "sour", "sugar", "cold", "exotic", "topping"] },
    { id: "m6", needs: ["base3", "sweetFruit", "fizz", "sour", "cold", "sugar"] },
    { id: "m7", needs: ["base4", "sour", "fizz", "cold", "herb", "sugar"] },
    { id: "m8", needs: ["base2", "bitter", "sweetFruit", "cold", "topping", "fizz"] },
    { id: "m9", needs: ["base1", "creamy", "exotic", "cold", "sugar", "sweetFruit"] },
    { id: "m10", needs: ["base4", "redFruit", "sweetFruit", "cold", "sour", "herb"] },
  ],
  7: [
    { id: "l1", needs: ["base1", "creamy", "exotic", "cold", "sugar", "sweetFruit", "topping"] },
    { id: "l2", needs: ["base3", "sour", "sugar", "cold", "sweetFruit", "fizz", "topping"] },
    { id: "l3", needs: ["base2", "bitter", "sweetFruit", "cold", "topping", "fizz", "sugar"] },
    { id: "l4", needs: ["base4", "redFruit", "sweetFruit", "cold", "sour", "herb", "sugar"] },
    { id: "l5", needs: ["base1", "sour", "herb", "sugar", "fizz", "cold", "topping"] },
    { id: "l6", needs: ["base3", "exotic", "sour", "sugar", "cold", "creamy", "topping"] },
    { id: "l7", needs: ["base2", "bitterHerb", "sour", "cold", "topping", "herb", "sugar"] },
    { id: "l8", needs: ["base4", "fizz", "sour", "cold", "herb", "redFruit", "sugar"] },
    { id: "l9", needs: ["base1", "redFruit", "sour", "cold", "sugar", "bitter", "topping"] },
    { id: "l10", needs: ["base3", "sweetFruit", "fizz", "sour", "cold", "sugar", "exotic"] },
  ],
};

/** Wie viele Zutaten ein Rezept in dieser Partie hat. */
export type RecipeLength = 5 | 6 | 7;

/** Die beiden Gewaender. */
export type Skin = "brew" | "bar";

/** Emoji der Zutat im gewaehlten Gewand. */
export function emojiFor(id: IngredientId, skin: Skin): string {
  return skin === "bar" ? INGREDIENTS[id].bar : INGREDIENTS[id].brew;
}

/** i18n-Schluessel fuer den Zutatennamen. */
export function ingredientKey(id: IngredientId, skin: Skin): string {
  return `games.brew.ing.${skin}.${id}`;
}

/** i18n-Schluessel fuer den Rezeptnamen. */
export function recipeKey(recipeId: string, skin: Skin): string {
  return `games.brew.recipe.${skin}.${recipeId}`;
}

// ---------------------------------------------------------------------------
// Artwork
//
// Die Bilddateien sind OPTIONAL. Fehlt eine, traegt das Emoji — genauso wie
// TVPartyMap den Verlauf traegt, wenn sein Hintergrund fehlt. Deshalb gibt es
// hier bewusst KEINE Existenzpruefung und keine Registry: der Pfad wird aus der
// Kennung gebaut, und `IngredientIcon` blendet das Bild nur ein, wenn es laedt.
// ---------------------------------------------------------------------------

/** Alle Zutaten-Kennungen in fester Reihenfolge — auch die Reihenfolge der Kontaktboegen. */
export const INGREDIENT_IDS = Object.keys(INGREDIENTS) as IngredientId[];

/** Pfad zum Zutaten-Artwork. Die Datei MUSS nicht existieren. */
export function ingredientImage(id: IngredientId, skin: Skin): string {
  return `/images/brew/${skin}-${id}.webp`;
}

/**
 * Die 16 Bilder des gewaehlten Gewands still vorwaermen.
 *
 * Kein `loading="lazy"` auf den Karten: sie sind winzig und erscheinen einzeln
 * beim Ziehen — eine spaet nachgeladene Karte ploppt auf dem Fernseher aus drei
 * Metern sichtbar nach. Nur das gewaehlte Gewand, die anderen 16 braucht in
 * dieser Partie niemand.
 */
let warmedSkin: Skin | null = null;
export function preloadIngredients(skin: Skin): void {
  if (warmedSkin === skin || typeof Image === "undefined") return;
  warmedSkin = skin;
  for (const id of INGREDIENT_IDS) {
    const img = new Image();
    img.decoding = "async";
    img.src = ingredientImage(id, skin);
  }
}
