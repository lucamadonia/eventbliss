// Resolve the EventBliss Stripe customer for a user/agency in the shared
// Stripe account (see stripe-project.ts).
//
// Never trust the first customer found by email: the same person may also be
// a Trackbliss/Wealthbliss customer in this account. Resolution order:
//   1. customer ids stored in EventBliss's own DB (subscriptions /
//      agency_marketplace_subscriptions), unless deleted or tagged foreign
//   2. fallback by email, accepting only customers tagged project=EVENT or
//      whose id is already stored for this user/agency
// A customer tagged with another project is never returned.
//
// No esm.sh imports, so vitest can load this module directly.
import { classifyStripeProject } from "./stripe-project.ts";

// Shallow structural type for the Supabase client. Importing the SDK type
// causes a generic mismatch (TS2345) with untyped `createClient(...)` clients,
// and a deep structural type makes TS recurse (TS2589), so callers pass any
// client with `from()` and we narrow it to the query subset used below.
interface QueryResult {
  data: unknown[] | null;
  error: { message: string } | null;
}
interface FilterQuery extends PromiseLike<QueryResult> {
  eq(column: string, value: string): FilterQuery;
  in(column: string, values: string[]): FilterQuery;
}
interface QueryDb {
  from(table: string): { select(columns: string): FilterQuery };
}
export interface StripeCustomerDb {
  from(table: string): unknown;
}
type Db = StripeCustomerDb;

const query = (db: Db, table: string) => (db as QueryDb).from(table);

export interface StripeCustomerLike {
  id: string;
  deleted?: unknown;
  metadata?: Record<string, string> | null;
}

/** The subset of the Stripe SDK used here (kept structural for testing). */
export interface StripeCustomerApi {
  customers: {
    retrieve(id: string): Promise<StripeCustomerLike>;
    list(params: { email: string; limit: number }): Promise<{ data: StripeCustomerLike[] }>;
  };
}

export type OwnCustomerSource = "db" | "email";

export interface OwnCustomer {
  customerId: string;
  source: OwnCustomerSource;
}

type Log = (step: string, details?: unknown) => void;

const EMAIL_LOOKUP_LIMIT = 10;

function readStringField(row: unknown, key: string): string | null {
  if (typeof row !== "object" || row === null) return null;
  const value = (row as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))];
}

/**
 * Picks the first customer that is EventBliss's: not deleted, not tagged with
 * another project, and either tagged project=EVENT or already stored in our DB.
 */
export function pickOwnCustomer(
  candidates: StripeCustomerLike[],
  knownCustomerIds: string[] = [],
): StripeCustomerLike | null {
  for (const customer of candidates) {
    if (customer.deleted === true) continue;
    const ownership = classifyStripeProject(customer.metadata);
    if (ownership === "foreign") continue;
    if (ownership === "own" || knownCustomerIds.includes(customer.id)) return customer;
  }
  return null;
}

export async function resolveOwnStripeCustomer(
  stripe: StripeCustomerApi,
  { knownCustomerIds, email, log }: {
    knownCustomerIds: Array<string | null | undefined>;
    email?: string | null;
    log?: Log;
  },
): Promise<OwnCustomer | null> {
  const known = uniqueIds(knownCustomerIds);

  for (const id of known) {
    let customer: StripeCustomerLike;
    try {
      customer = await stripe.customers.retrieve(id);
    } catch (error) {
      log?.("Stored Stripe customer not retrievable, skipping", {
        customerId: id,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (customer.deleted === true) {
      log?.("Stored Stripe customer is deleted, skipping", { customerId: id });
      continue;
    }
    if (classifyStripeProject(customer.metadata) === "foreign") {
      log?.("Stored Stripe customer belongs to another project, skipping", { customerId: id });
      continue;
    }
    return { customerId: customer.id, source: "db" };
  }

  if (!email) return null;

  const customers = await stripe.customers.list({ email, limit: EMAIL_LOOKUP_LIMIT });
  const picked = pickOwnCustomer(customers.data, known);
  if (picked) return { customerId: picked.id, source: "email" };

  if (customers.data.length > 0) {
    log?.("Customers with this email exist but none belongs to EventBliss", {
      count: customers.data.length,
    });
  }
  return null;
}

/** Stripe customer ids stored for the user's own (non-agency) subscription. */
export async function loadUserStripeCustomerIds(db: Db, userId: string): Promise<string[]> {
  const { data, error } = await query(db, "subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId);
  if (error) throw new Error(`Subscription lookup failed: ${error.message}`);
  return uniqueIds((data ?? []).map((row) => readStringField(row, "stripe_customer_id")));
}

/**
 * Stripe customer ids stored for agency tier subscriptions — either for the
 * given agency ids or for all agencies owned by `ownerId`.
 */
export async function loadAgencyStripeCustomerIds(
  db: Db,
  { agencyIds = [], ownerId }: { agencyIds?: string[]; ownerId?: string },
): Promise<string[]> {
  const ids = [...agencyIds];
  if (ownerId) {
    const { data, error } = await query(db, "agencies").select("id").eq("owner_id", ownerId);
    if (error) throw new Error(`Agency lookup failed: ${error.message}`);
    ids.push(...uniqueIds((data ?? []).map((row) => readStringField(row, "id"))));
  }
  const agencyIdList = uniqueIds(ids);
  if (agencyIdList.length === 0) return [];

  const { data, error } = await query(db, "agency_marketplace_subscriptions")
    .select("stripe_customer_id")
    .in("agency_id", agencyIdList);
  if (error) throw new Error(`Agency subscription lookup failed: ${error.message}`);
  return uniqueIds((data ?? []).map((row) => readStringField(row, "stripe_customer_id")));
}
