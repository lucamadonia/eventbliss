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

/** Event page tabs that disappear with a switched-off area. */
export function hiddenEventTabs(state: AppSwitchState): string[] {
  return [
    ...(state.marketplaceOff ? ["marketplace"] : []),
    ...(state.servicesOff ? ["dienstleister"] : []),
  ];
}
