import { describe, expect, it, vi } from 'vitest';
import {
  loadAgencyStripeCustomerIds,
  loadUserStripeCustomerIds,
  pickOwnCustomer,
  resolveOwnStripeCustomer,
  type StripeCustomerApi,
  type StripeCustomerLike,
} from '../../supabase/functions/_shared/stripe-customer';

const event = (id: string): StripeCustomerLike => ({ id, metadata: { project: 'EVENT' } });
const wealth = (id: string): StripeCustomerLike => ({ id, metadata: { project: 'WEALTH' } });
const untagged = (id: string): StripeCustomerLike => ({ id, metadata: {} });

function stripeMock(
  byId: Record<string, StripeCustomerLike | Error>,
  byEmail: StripeCustomerLike[] = [],
) {
  const retrieve = vi.fn(async (id: string) => {
    const hit = byId[id];
    if (!hit) throw new Error('No such customer');
    if (hit instanceof Error) throw hit;
    return hit;
  });
  const list = vi.fn(async () => ({ data: byEmail }));
  const stripe: StripeCustomerApi = { customers: { retrieve, list } };
  return { stripe, retrieve, list };
}

describe('pickOwnCustomer', () => {
  it('never picks a customer tagged with another project, even if its id is stored', () => {
    expect(pickOwnCustomer([wealth('cus_w')], ['cus_w'])).toBeNull();
  });

  it('skips foreign and unknown untagged customers and picks the EVENT one', () => {
    expect(pickOwnCustomer([wealth('cus_w'), untagged('cus_u'), event('cus_e')])?.id).toBe('cus_e');
  });

  it('accepts an untagged customer only if its id is stored in our DB', () => {
    expect(pickOwnCustomer([untagged('cus_u')])).toBeNull();
    expect(pickOwnCustomer([untagged('cus_u')], ['cus_u'])?.id).toBe('cus_u');
  });

  it('ignores deleted customers', () => {
    expect(pickOwnCustomer([{ id: 'cus_d', deleted: true, metadata: { project: 'EVENT' } }])).toBeNull();
  });
});

describe('resolveOwnStripeCustomer', () => {
  it('prefers the customer stored in the DB without an email lookup', async () => {
    const { stripe, list } = stripeMock({ cus_db: untagged('cus_db') }, [event('cus_e')]);
    await expect(
      resolveOwnStripeCustomer(stripe, { knownCustomerIds: ['cus_db'], email: 'a@b.c' }),
    ).resolves.toEqual({ customerId: 'cus_db', source: 'db' });
    expect(list).not.toHaveBeenCalled();
  });

  it('skips stored customers that are foreign, deleted or missing', async () => {
    const { stripe, retrieve } = stripeMock(
      {
        cus_w: wealth('cus_w'),
        cus_del: { id: 'cus_del', deleted: true },
        cus_err: new Error('boom'),
        cus_ok: event('cus_ok'),
      },
      [],
    );
    await expect(
      resolveOwnStripeCustomer(stripe, {
        knownCustomerIds: ['cus_w', 'cus_del', 'cus_err', 'cus_missing', 'cus_ok'],
        email: 'a@b.c',
      }),
    ).resolves.toEqual({ customerId: 'cus_ok', source: 'db' });
    expect(retrieve).toHaveBeenCalledTimes(5);
  });

  it('falls back to email but only accepts EVENT-tagged customers', async () => {
    const { stripe, list } = stripeMock({}, [wealth('cus_w'), untagged('cus_u'), event('cus_e')]);
    await expect(
      resolveOwnStripeCustomer(stripe, { knownCustomerIds: [null, undefined, ''], email: 'a@b.c' }),
    ).resolves.toEqual({ customerId: 'cus_e', source: 'email' });
    expect(list).toHaveBeenCalledWith({ email: 'a@b.c', limit: 10 });
  });

  it('returns null when the email only matches other apps or unknown customers', async () => {
    const { stripe } = stripeMock({}, [wealth('cus_w'), untagged('cus_u')]);
    await expect(
      resolveOwnStripeCustomer(stripe, { knownCustomerIds: [], email: 'a@b.c' }),
    ).resolves.toBeNull();
  });

  it('returns null without an email when nothing is stored', async () => {
    const { stripe, list } = stripeMock({});
    await expect(resolveOwnStripeCustomer(stripe, { knownCustomerIds: [] })).resolves.toBeNull();
    expect(list).not.toHaveBeenCalled();
  });

  it('retrieves each stored id once', async () => {
    const { stripe, retrieve } = stripeMock({ cus_a: untagged('cus_a') });
    await resolveOwnStripeCustomer(stripe, { knownCustomerIds: ['cus_a', 'cus_a'] });
    expect(retrieve).toHaveBeenCalledTimes(1);
  });
});

function fakeDb(tables: Record<string, Array<Record<string, unknown>>>) {
  const db = {
    from(table: string) {
      return {
        select() {
          let rows = tables[table] ?? [];
          const builder = {
            eq(column: string, value: string) {
              rows = rows.filter(row => row[column] === value);
              return builder;
            },
            in(column: string, values: string[]) {
              rows = rows.filter(row => values.includes(row[column] as string));
              return builder;
            },
            then(resolve: (r: { data: unknown[]; error: null }) => unknown) {
              return Promise.resolve({ data: rows, error: null }).then(resolve);
            },
          };
          return builder;
        },
      };
    },
  };
  return { db };
}

describe('DB customer id loaders', () => {
  const { db } = fakeDb({
    subscriptions: [
      { user_id: 'u1', stripe_customer_id: 'cus_u1' },
      { user_id: 'u2', stripe_customer_id: 'cus_u2' },
      { user_id: 'u3', stripe_customer_id: null },
    ],
    agencies: [
      { id: 'a1', owner_id: 'u1' },
      { id: 'a2', owner_id: 'u2' },
    ],
    agency_marketplace_subscriptions: [
      { agency_id: 'a1', stripe_customer_id: 'cus_a1' },
      { agency_id: 'a2', stripe_customer_id: 'cus_a2' },
    ],
  });

  it("loads only the user's own stored customer id", async () => {
    await expect(loadUserStripeCustomerIds(db, 'u1')).resolves.toEqual(['cus_u1']);
    await expect(loadUserStripeCustomerIds(db, 'u3')).resolves.toEqual([]);
  });

  it('loads agency customer ids by agency id or owner', async () => {
    await expect(loadAgencyStripeCustomerIds(db, { agencyIds: ['a2'] })).resolves.toEqual(['cus_a2']);
    await expect(loadAgencyStripeCustomerIds(db, { ownerId: 'u1' })).resolves.toEqual(['cus_a1']);
    await expect(loadAgencyStripeCustomerIds(db, {})).resolves.toEqual([]);
  });
});
