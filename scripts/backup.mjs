/**
 * Backup script for RentNow Supabase database.
 * Usage: node scripts/backup.mjs
 *
 * Requires env vars:
 *   SUPABASE_SERVICE_ROLE_KEY (not anon key, needs table read access)
 *   NEXT_PUBLIC_SUPABASE_URL
 *
 * Optional:
 *   BACKUP_DIR (default: ./backups)
 *
 * This script exports all tables as JSON files, one per table.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const backupDir = process.env.BACKUP_DIR || join(__dirname, '..', 'backups');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'profiles',
  'properties',
  'contracts',
  'payments',
  'notifications',
  'expenses',
  'maintenance_requests',
  'leads',
  'documents',
  'push_subscriptions',
  'subscriptions',
];

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = join(backupDir, timestamp);

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`[SKIP] ${table}: ${error.message}`);
        continue;
      }
      const filePath = join(dir, `${table}.json`);
      writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[OK] ${table}: ${data.length} rows -> ${filePath}`);
    } catch (err) {
      console.error(`[ERROR] ${table}: ${err}`);
    }
  }

  // Write manifest
  const manifest = { timestamp, tables: TABLES, total: new Date().toISOString() };
  writeFileSync(join(dir, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nBackup complete: ${dir}`);
}

backup().catch(console.error);
