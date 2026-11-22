/**
 * app-switches.ts — areas of the native app an admin can hide without an app
 * release. Each switch is a kill-switch row in `feature_flags`: no row (or a
 * disabled one) means the area is visible; an enabled row at full rollout
 * hides it. Pure data and rules, shared by the app and the admin portal.
 */
export type AppArea = "marketplace" | "services";

export interface AppSwitch {
  /** `feature_flags.key` */
  key: string;
  area: AppArea;
  /** Stored with the row so the generic flag list explains itself. */
  name: string;
  description: string;
}

export const APP_SWITCHES: readonly AppSwitch[] = [
  {
    key: "app_marketplace_off",
    area: "marketplace",
    name: "App: Marktplatz ausblenden",
    description: "Blendet den Marktplatz in der App aus: Startseite, Event-Reiter, Onboarding und die Marktplatz-Seiten.",
  },
  {
    key: "app_services_off",
    area: "services",
    name: "App: Services ausblenden",
    description: "Blendet den Reiter „Services“ (gebuchte Dienstleistungen) auf der Event-Seite der App aus.",
  },
];

export const appSwitchFor = (area: AppArea): AppSwitch => APP_SWITCHES.find((entry) => entry.area === area)!;

/**
 * Kill switches for features that exist on web AND in the app. Same row
 * convention as `APP_SWITCHES` (enabled at full rollout = switched off); the
 * readers are `ExpensesGate` / `useFeatureFlag("form_studio_off")`.
 */
export type FeatureSwitchKey = "expenses_v2_off" | "form_studio_off";

export interface FeatureSwitch {
  /** `feature_flags.key` */
  key: FeatureSwitchKey;
  name: string;
  description: string;
}

export const FEATURE_SWITCHES: readonly FeatureSwitch[] = [
  {
    key: "expenses_v2_off",
    name: "Ausgaben: neue Version ausblenden",
    description: "Schaltet die Ausgaben-Seite auf die ältere Version zurück (Web und App).",
  },
  {
    key: "form_studio_off",
    name: "Form Studio ausblenden",
    description: "Blendet Form Studio aus: einfacher Formular-Editor statt Studio, keine KI-Formulare, keine eigenen Fragen.",
  },
];

/** Hidden games are stored as `game_<id>_off` rows. */
export const gameFlagKey = (gameId: string): string => `game_${gameId}_off`;

/** Inverse of `gameFlagKey`; `null` for any other key. */
export function gameIdFromFlagKey(key: string): string | null {
  const match = /^game_(.+)_off$/.exec(key);
  return match ? match[1] : null;
}

/** Rows the visibility admin tab owns, so the generic flag list does not show them a second time. */
export function isManagedFlagKey(key: string): boolean {
  return /^app_.+_off$/.test(key)
    || gameIdFromFlagKey(key) !== null
    || FEATURE_SWITCHES.some((entry) => entry.key === key);
}

export interface AppSwitchState { marketplaceOff: boolean; servicesOff: boolean }

interface FlagRow { is_enabled: boolean; rollout_percentage: number | null }

/**
 * Is an area hidden for everyone? Only an enabled row at full rollout counts:
 * a partial rollout would hide the area for some users and not for others,
 * which is not what "switched off" means in the admin portal.
 */
export function isSwitchedOff(row: FlagRow | null | undefined): boolean {
  return !!row && row.is_enabled && (row.rollout_percentage ?? 100) >= 100;
}

/**
 * Ids of the games an admin has hidden. Unknown keys and rows that are not a
 * full-rollout kill switch are ignored; no rows (loading, error) hide nothing.
 */
export function hiddenGameIds(rows: readonly (FlagRow & { key: string })[] | null | undefined): Set<string> {
  const hidden = new Set<string>();
  for (const row of rows ?? []) {
    const id = gameIdFromFlagKey(row.key);
    if (id && isSwitchedOff(row)) hidden.add(id);
  }
  return hidden;
}

/** Games a player may pick. Returns the input untouched when nothing is hidden. */
export function visibleGames<T extends { id: string }>(games: readonly T[], hidden: ReadonlySet<string>): readonly T[] {
  return hidden.size === 0 ? games : games.filter((game) => !hidden.has(game.id));
}

/** Event page tabs that disappear with a switched-off area. */
export function hiddenEventTabs(state: AppSwitchState): string[] {
  return [
    ...(state.marketplaceOff ? ["marketplace"] : []),
    ...(state.servicesOff ? ["dienstleister"] : []),
  ];
}
