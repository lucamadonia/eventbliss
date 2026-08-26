/**
 * Die Wertelisten des Influencer-Programms — EINE Quelle fuer Datenbank und
 * Oberflaeche.
 *
 * WARUM SO STRENG: an einem einzigen Tag sind in diesem Projekt drei
 * Constraint-Fehler aufgelaufen (23514), alle nach demselben Muster — eine
 * Liste stand in der Oberflaeche, eine andere im CHECK der Tabelle, und die
 * Oberflaeche bot Werte an, die die Spalte nie akzeptieren konnte. Der
 * Adminbereich zeigte vier Plan-Knoepfe, von denen drei zwangslaeufig
 * scheiterten.
 *
 * Deshalb: Die Migration schreibt ihre CHECK-Klauseln aus genau diesen Listen
 * ab, und jede Auswahl in der Oberflaeche wird aus ihnen gebaut. Wer hier einen
 * Wert ergaenzt, muss die Migration anfassen — und merkt es sofort, weil der
 * Kommentar es sagt.
 */

/**
 * Der Weg eines Influencers von der Recherche bis zur erfuellten Zusage.
 *
 * `ghosted` ist bewusst dabei: eine Liste, in der niemand jemals "hat sich nie
 * gemeldet" ist, sieht gepflegter aus, als sie ist.
 */
export const INFLUENCER_STATUSES = [
  "new",
  "queued",
  "contacted",
  "follow_up_1",
  "follow_up_2",
  "replied",
  "negotiating",
  "accepted",
  "onboarded",
  "delivering",
  "delivered",
  "completed",
  "declined",
  "ghosted",
  "cancelled",
] as const;
export type InfluencerStatus = (typeof INFLUENCER_STATUSES)[number];

/** Deutsche Beschriftung — der Adminbereich ist durchgehend deutsch. */
export const INFLUENCER_STATUS_LABEL: Record<InfluencerStatus, string> = {
  new: "Neu",
  queued: "Eingeplant",
  contacted: "Angeschrieben",
  follow_up_1: "1. Nachfassen",
  follow_up_2: "2. Nachfassen",
  replied: "Hat geantwortet",
  negotiating: "In Abstimmung",
  accepted: "Zugesagt",
  onboarded: "Zugang aktiv",
  delivering: "Liefert",
  delivered: "Geliefert",
  completed: "Abgeschlossen",
  declined: "Abgesagt",
  ghosted: "Keine Reaktion",
  cancelled: "Abgebrochen",
};

/** Die Spalten des Trichters — Reihenfolge ist die Reihenfolge im Ablauf. */
export const INFLUENCER_PIPELINE: readonly InfluencerStatus[] = [
  "new", "queued", "contacted", "follow_up_1", "follow_up_2",
  "replied", "negotiating", "accepted", "onboarded", "delivering",
  "delivered", "completed",
];

/** Aus dem Rennen — taucht nicht im Trichter auf, aber im Filter. */
export const INFLUENCER_CLOSED: readonly InfluencerStatus[] = ["declined", "ghosted", "cancelled"];

export const INFLUENCER_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "twitch",
  "podcast",
  "other",
] as const;
export type InfluencerPlatform = (typeof INFLUENCER_PLATFORMS)[number];

export const INFLUENCER_PLATFORM_LABEL: Record<InfluencerPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  podcast: "Podcast",
  other: "Andere",
};

export const INFLUENCER_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type InfluencerPriority = (typeof INFLUENCER_PRIORITIES)[number];

export const INFLUENCER_PRIORITY_LABEL: Record<InfluencerPriority, string> = {
  low: "Niedrig",
  normal: "Normal",
  high: "Hoch",
  urgent: "Dringend",
};

/**
 * Was ein Influencer bekommt. Mehrere gleichzeitig sind ausdruecklich erlaubt —
 * Gratis-Premium UND Provision ist der Normalfall, nicht die Ausnahme.
 */
export const INFLUENCER_REWARDS = ["trial", "unlimited", "commission", "fee"] as const;
export type InfluencerReward = (typeof INFLUENCER_REWARDS)[number];

export const INFLUENCER_REWARD_LABEL: Record<InfluencerReward, string> = {
  trial: "Probe-Abo",
  unlimited: "Premium unbegrenzt",
  commission: "Provision",
  fee: "Festhonorar",
};

/** Reichweite lesbar machen: 12500 → "12,5 Tsd." */
export function formatReach(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} Mio.`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".", ",")} Tsd.`;
  return String(n);
}
