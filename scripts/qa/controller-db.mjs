import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

/** Isolated real Postgres engine for QA; auth claims are synthetic, never production credentials. */
export async function createDB() {
  const db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.subscriptions(user_id uuid PRIMARY KEY, plan text, expires_at timestamptz);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('test.anonymous',true),''),'false')::boolean) $$;
    CREATE FUNCTION public.is_premium(uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
      SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=uid AND plan='premium' AND (expires_at IS NULL OR expires_at>now())) $$;
  `);
  const social = await readFile(new URL('../../supabase/migrations/20260401000000_game_social.sql', import.meta.url), 'utf8');
  await db.exec(social.slice(social.indexOf('CREATE TABLE IF NOT EXISTS public.game_stats'), social.indexOf('-- Achievements definitions')));
  for (const migration of ['20260922235000_controller_parties.sql', '20261001120000_party_play_guests.sql', '20261006160000_ohrwurm_team_capacity.sql', '20261008120000_controller_party_upgrade.sql']) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${migration}`, import.meta.url), 'utf8'));
  }
  return {
    db,
    async seedUser(userId, { premium = false } = {}) {
      await db.query('INSERT INTO auth.users(id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
      await db.query('INSERT INTO public.subscriptions VALUES ($1,$2,NULL) ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan', [userId, premium ? 'premium' : 'free']);
    },
    async request(userId, action, code = null, payload = {}) {
      // One transaction binds identity and role to this request, including concurrent browser tabs.
      return db.transaction(async tx => {
        await tx.query("SELECT set_config('test.uid',$1,true),set_config('test.anonymous','false',true)", [userId || '']);
        await tx.exec('SET LOCAL ROLE authenticated');
        const result = await tx.query('SELECT public.controller_party_request($1,$2,$3::jsonb) AS data', [action, code, JSON.stringify(payload)]);
        return result.rows[0].data;
      });
    },
    async upgrade(userId, payload) {
      return db.transaction(async tx => {
        await tx.query("SELECT set_config('test.uid',$1,true),set_config('test.anonymous','false',true)", [userId || '']);
        await tx.exec('SET LOCAL ROLE authenticated');
        const result = await tx.query('SELECT public.controller_party_upgrade($1::jsonb) AS data', [JSON.stringify(payload)]);
        return result.rows[0].data;
      });
    },
    close: () => db.close(),
  };
}
