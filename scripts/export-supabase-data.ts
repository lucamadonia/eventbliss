/**
 * Supabase Full Database Export to JSON
 *
 * Exportiert alle Tabellen der alten Supabase-DB als JSON-Dateien.
 *
 * Usage:
 *   npx tsx scripts/export-supabase-data.ts
 *
 * Voraussetzung: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY als Env Vars
 * oder direkt unten eintragen.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// === KONFIGURATION ===
// Alte Supabase-Instanz
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kqsfifsghvrnemfaxpef.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY fehlt!');
  console.error('   Setze die Variable: export SUPABASE_SERVICE_ROLE_KEY="dein-service-role-key"');
  console.error('   Du findest den Key unter: https://supabase.com/dashboard/project/kqsfifsghvrnemfaxpef/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Alle Tabellen die exportiert werden sollen
const TABLES = [
  'activity_comments',
  'admin_messages',
  'affiliate_commissions',
  'affiliate_payouts',
  'affiliate_vouchers',
  'affiliates',
  'agency_affiliates',
  'agency_interactions',
  'ai_credit_adjustments',
  'ai_usage',
  'events',
  'expense_shares',
  'expenses',
  'message_templates',
  'newsletter_subscribers',
  'participants',
  'plan_configs',
  'processed_webhook_events',
  'profiles',
  'responses',
  'schedule_activities',
  'settings',
  'subscriptions',
  'user_activity_logs',
  'user_feedback',
  'user_roles',
  'voucher_redemptions',
  'vouchers',
];

const OUTPUT_DIR = path.join(__dirname, '..', 'exports', 'supabase-backup');

async function exportTable(tableName: string): Promise<{ table: string; count: number; error?: string }> {
  try {
    // Supabase paginiert bei 1000 Rows - wir holen alles
    let allRows: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: true, nullsFirst: true });

      if (error) {
        // Fallback: manche Tabellen haben kein created_at
        const { data: dataNoSort, error: error2 } = await supabase
          .from(tableName)
          .select('*')
          .range(offset, offset + pageSize - 1);

        if (error2) {
          return { table: tableName, count: 0, error: error2.message };
        }

        if (dataNoSort && dataNoSort.length > 0) {
          allRows = allRows.concat(dataNoSort);
          offset += pageSize;
          hasMore = dataNoSort.length === pageSize;
        } else {
          hasMore = false;
        }
      } else {
        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
    }

    // JSON-Datei schreiben
    const filePath = path.join(OUTPUT_DIR, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2), 'utf-8');

    return { table: tableName, count: allRows.length };
  } catch (err: any) {
    return { table: tableName, count: 0, error: err.message };
  }
}

async function exportStorage(): Promise<void> {
  console.log('\n📦 Exportiere Storage Buckets...');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('  ❌ Storage-Export fehlgeschlagen:', error.message);
    return;
  }

  if (!buckets || buckets.length === 0) {
    console.log('  ℹ️  Keine Storage Buckets gefunden');
    return;
  }

  const storageDir = path.join(OUTPUT_DIR, 'storage');
  fs.mkdirSync(storageDir, { recursive: true });

  // Bucket-Metadaten speichern
  fs.writeFileSync(
    path.join(storageDir, '_buckets.json'),
    JSON.stringify(buckets, null, 2),
    'utf-8'
  );

  for (const bucket of buckets) {
    console.log(`  📁 Bucket: ${bucket.name}`);

    const bucketDir = path.join(storageDir, bucket.name);
    fs.mkdirSync(bucketDir, { recursive: true });

    // Dateien im Bucket auflisten
    const { data: files, error: listError } = await supabase.storage
      .from(bucket.name)
      .list('', { limit: 1000 });

    if (listError) {
      console.error(`    ❌ Fehler beim Auflisten: ${listError.message}`);
      continue;
    }

    if (!files || files.length === 0) {
      console.log('    ℹ️  Leer');
      continue;
    }

    // Dateiliste speichern
    fs.writeFileSync(
      path.join(bucketDir, '_files.json'),
      JSON.stringify(files, null, 2),
      'utf-8'
    );

    // Dateien herunterladen
    for (const file of files) {
      if (!file.name || file.id === null) continue; // Skip folders

      try {
        const { data: blob, error: dlError } = await supabase.storage
          .from(bucket.name)
          .download(file.name);

        if (dlError || !blob) {
          console.error(`    ❌ ${file.name}: ${dlError?.message}`);
          continue;
        }

        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(path.join(bucketDir, file.name), buffer);
        console.log(`    ✅ ${file.name} (${(buffer.length / 1024).toFixed(1)} KB)`);
      } catch (err: any) {
        console.error(`    ❌ ${file.name}: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Supabase Export gestartet');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);

  // Output-Verzeichnis erstellen
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Alle Tabellen exportieren
  console.log('📋 Exportiere Tabellen...\n');

  const results = await Promise.all(TABLES.map(exportTable));

  // Zusammenfassung
  console.log('\n' + '='.repeat(50));
  console.log('📊 EXPORT ZUSAMMENFASSUNG');
  console.log('='.repeat(50));

  let totalRows = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (result.error) {
      console.log(`  ❌ ${result.table}: ${result.error}`);
      errors.push(result.table);
    } else {
      console.log(`  ✅ ${result.table}: ${result.count} Einträge`);
      totalRows += result.count;
    }
  }

  // Storage exportieren
  await exportStorage();

  // Gesamtübersicht als JSON
  const summary = {
    exportDate: new Date().toISOString(),
    sourceUrl: SUPABASE_URL,
    tables: results,
    totalRows,
    errors,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_export-summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Export abgeschlossen!`);
  console.log(`   ${results.length - errors.length}/${results.length} Tabellen exportiert`);
  console.log(`   ${totalRows} Einträge gesamt`);
  console.log(`   📁 Dateien in: ${OUTPUT_DIR}`);

  if (errors.length > 0) {
    console.log(`   ⚠️  ${errors.length} Fehler - prüfe die Ausgabe oben`);
  }
}

main().catch(console.error);
