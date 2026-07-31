// ============================================================
// apply-banners-migration.mjs
// Apply banner migrations via direct Postgres connection.
// Usage:
//   1) Buka Supabase Dashboard → Project Settings → Database
//   2) Connection string → "Direct connection" → Transaction mode
//   3) Copy full URI (postgresql://postgres:[PASSWORD]@db.XXX.supabase.co:5432/postgres)
//   4) Urun: DATABASE_URL="<copy>" node scripts/apply-banners-migration.mjs
// ============================================================

import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set.");
  console.error("");
  console.error("Cara ambil:");
  console.error("  1. Buka https://supabase.com/dashboard/project/vnypmrdrppzoynvsivyz/settings/database");
  console.error("  2. Section \"Connection string\" → tab \"Direct connection\"");
  console.error("  3. Copy URI (postgresql://postgres:[PASSWORD]@db.vnypmrdrppzoynvsivyz.supabase.co:5432/postgres)");
  console.error("  4. Run: DATABASE_URL=\"<paste>\" node scripts/apply-banners-migration.mjs");
  process.exit(1);
}

const migrations = [
  "supabase/migrations/018_banners_table.sql",
  "supabase/migrations/021_banners_hide_overlay.sql",
  "supabase/migrations/020_seed_real_banners.sql",
];

async function main() {
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  console.log("🔌 Connecting to database...");
  await client.connect();
  console.log("✓ Connected\n");

  for (const rel of migrations) {
    const full = path.join(repoRoot, rel);
    const sql = fs.readFileSync(full, "utf8");
    console.log(`📄 Applying ${rel}`);
    try {
      await client.query(sql);
      console.log(`✓ ${rel} applied\n`);
    } catch (e) {
      console.error(`❌ Failed at ${rel}:`);
      console.error(e.message);
      console.error("\nStopping. Fix the error above and re-run.");
      await client.end();
      process.exit(2);
    }
  }

  // Verify
  const { rows } = await client.query(
    "SELECT position, sort_order, title, image_url, hide_overlay FROM public.banners ORDER BY position, sort_order"
  );
  console.log("📊 Banners row inserted:");
  console.table(rows);

  await client.end();
  console.log("\n✅ Done! Refresh homepage to see banners.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(99);
});