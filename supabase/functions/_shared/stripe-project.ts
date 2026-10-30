// Project isolation for the shared Stripe account.
//
// The live Stripe account is shared by several apps (EventBliss, Trackbliss,
// Wealthbliss, ...). Stripe delivers every event to every webhook endpoint
// that subscribed to its type, so our webhooks also receive other apps'
// purchases. Each app tags the Stripe objects it creates with
// `metadata.project`; EventBliss uses "EVENT".
//
// Contract:
// - Every Stripe object EventBliss creates carries `metadata.project = "EVENT"`.
// - Webhooks ignore objects tagged with another project (log + 200).
// - Untagged (legacy) objects are only processed when they can be matched to
//   EventBliss's own database via Stripe IDs or our own metadata ids — never
//   by customer email.
//
// Kept free of Deno/npm imports so it can be unit-tested with vitest.

export const STRIPE_PROJECT = "EVENT";

export type StripeProjectOwnership = "own" | "foreign" | "untagged";

type Metadata = Record<string, string | undefined> | null | undefined;

/** Reads `metadata.project`, trimmed and upper-cased; null when unset/empty. */
export function getStripeProject(metadata: Metadata): string | null {
  const raw = metadata?.project;
  if (typeof raw !== "string") return null;
  const value = raw.trim().toUpperCase();
  return value.length > 0 ? value : null;
}

/**
 * "own"      — tagged project=EVENT
 * "foreign"  — tagged with any other project (must be ignored)
 * "untagged" — no project tag (legacy; only process if matched via our own ids)
 */
export function classifyStripeProject(metadata: Metadata): StripeProjectOwnership {
  const project = getStripeProject(metadata);
  if (project === null) return "untagged";
  return project === STRIPE_PROJECT ? "own" : "foreign";
}

/** Returns a copy of `metadata` with `project = "EVENT"` set. */
export function withStripeProject<T extends Record<string, string>>(
  metadata?: T,
): T & { project: typeof STRIPE_PROJECT } {
  return { ...(metadata ?? ({} as T)), project: STRIPE_PROJECT };
}
