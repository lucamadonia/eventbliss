/**
 * Das Briefing eines Influencers — Felder, Vorlagen-Uebernahme und die
 * Positivliste, die bestimmt, was nach aussen darf.
 *
 * DREI EBENEN, ABSICHTLICH:
 *   Vorlage       — einmal schreiben, fuer viele nutzen (je Gruppe/Paket)
 *   Briefing      — die KOPIE beim Influencer, frei anpassbar
 *   Schnappschuss — beim Deal eingefroren, als Beleg
 *
 * Es wird KOPIERT, nicht verwiesen. Wer eine Vorlage aendert, soll nicht
 * rueckwirkend aendern, was jemand vor drei Wochen zugesagt bekommen hat.
 *
 * DIE HEIKELSTE STELLE IST `internal_notes`. Das Feld existiert genau fuer die
 * Saetze, die der Influencer nie lesen soll ("heikel, vorsichtig
 * formulieren"). Deshalb filtert `briefingForPortal` ueber eine POSITIVLISTE:
 * ein neues Feld ist damit standardmaessig intern und muss bewusst
 * freigegeben werden. Die Gegenrichtung ("alles ausser internal_notes") waere
 * genau einmal falsch — beim naechsten neuen Feld.
 */

export interface BriefingFields {
  headline: string;
  core_message: string;
  tone: string;
  dos: string[];
  donts: string[];
  mention_handles: string[];
  hashtags: string[];
  link_url: string;
  discount_code: string;
  discount_note: string;
  /**
   * Kennzeichnungspflicht. STANDARD IST TRUE: verguetete Beitraege sind in
   * Deutschland kennzeichnungspflichtig, und eine Voreinstellung, die das
   * vergisst, produziert Verstoesse — nicht bei uns, sondern beim Influencer.
   */
  disclosure_required: boolean;
  disclosure_text: string;
  /** Muessen wir vor Veroeffentlichung freigeben? */
  approval_required: boolean;
  publish_from: string | null;
  publish_until: string | null;
  extra: string;
  /** NIE im persoenlichen Bereich sichtbar. Siehe Kopfkommentar. */
  internal_notes: string;
}

export const EMPTY_BRIEFING: BriefingFields = {
  headline: "",
  core_message: "",
  tone: "",
  dos: [],
  donts: [],
  mention_handles: ["@eventbliss"],
  hashtags: [],
  link_url: "https://event-bliss.com",
  discount_code: "",
  discount_note: "",
  disclosure_required: true,
  disclosure_text: "Werbung",
  approval_required: false,
  publish_from: null,
  publish_until: null,
  extra: "",
  internal_notes: "",
};

/** Die Felder, die eine Vorlage und ein Briefing gemeinsam haben. */
export const BRIEFING_FIELDS = Object.keys(EMPTY_BRIEFING) as (keyof BriefingFields)[];

/**
 * Vorlage in ein Briefing uebernehmen.
 *
 * Unbekannte oder fehlende Felder fallen auf den Standard zurueck, statt
 * `undefined` in die Datenbank zu tragen — eine halb gefuellte Vorlage soll
 * ein vollstaendiges Briefing ergeben.
 */
export function fromTemplate(template: Partial<BriefingFields> | null | undefined): BriefingFields {
  if (!template) return { ...EMPTY_BRIEFING };
  // Listen werden KOPIERT, nicht verwiesen. Ein flaches Streuen der Vorlage
  // haette dieselbe Array-Instanz weitergereicht — wer danach im Briefing
  // einen Punkt ergaenzt, haette die Vorlage mitgeaendert und damit
  // rueckwirkend auch jedes andere Briefing, das noch daran haengt.
  const out = { ...EMPTY_BRIEFING, dos: [], donts: [], mention_handles: [...EMPTY_BRIEFING.mention_handles], hashtags: [] };
  for (const key of BRIEFING_FIELDS) {
    const value = template[key];
    if (value === undefined || value === null) continue;
    // @ts-expect-error — Schluessel und Wert stammen aus derselben Struktur.
    out[key] = Array.isArray(value) ? [...value] : value;
  }
  return out;
}

/**
 * Was der Influencer sehen darf.
 *
 * Positivliste, kein Ausschluss: ein spaeter ergaenztes Feld ist damit
 * automatisch intern, bis jemand es hier eintraegt.
 */
export const PORTAL_FIELDS = [
  "headline",
  "core_message",
  "tone",
  "dos",
  "donts",
  "mention_handles",
  "hashtags",
  "link_url",
  "discount_code",
  "discount_note",
  "disclosure_required",
  "disclosure_text",
  "approval_required",
  "publish_from",
  "publish_until",
  "extra",
] as const;

export type PortalBriefing = Pick<BriefingFields, (typeof PORTAL_FIELDS)[number]>;

export function briefingForPortal(
  briefing: Partial<BriefingFields> | null | undefined,
): PortalBriefing | null {
  if (!briefing) return null;
  const full = fromTemplate(briefing);
  const out = {} as PortalBriefing;
  for (const key of PORTAL_FIELDS) {
    // @ts-expect-error — Schluessel stammt aus PORTAL_FIELDS, Wert aus derselben Struktur.
    out[key] = full[key];
  }
  return out;
}

/** Ist ueberhaupt etwas eingetragen? Steuert die Anzeige "noch kein Briefing". */
export function hasBriefingContent(b: Partial<BriefingFields> | null | undefined): boolean {
  if (!b) return false;
  return Boolean(
    b.headline?.trim() ||
      b.core_message?.trim() ||
      b.extra?.trim() ||
      b.discount_code?.trim() ||
      (b.dos && b.dos.length) ||
      (b.donts && b.donts.length) ||
      (b.hashtags && b.hashtags.length),
  );
}

/** Kommagetrennte Eingabe zu einer Liste — leere Stuecke fallen weg. */
export function toList(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Eine Zeile je Eintrag — fuer Do's und Don'ts, die laenger sind als ein Wort. */
export function toLines(raw: string): string[] {
  return raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
