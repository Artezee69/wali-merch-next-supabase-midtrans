// Try common Supabase pooler configs
import pg from "pg";

const { Client } = pg;
const projectRef = "vnypmrdrppzoynvsivyz";

// Extract service role key from .env.local
import fs from "node:fs";
const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
const serviceKey = match?.[1]?.trim();

const candidates = [
  {
    name: "direct db, postgres user, service key",
    config: {
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: serviceKey,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  },
  {
    name: "pooler session, postgres user, service key",
    config: {
      host: `aws-0-ap-southeast-1.pooler.supabase.com`,
      port: 5432,
      database: "postgres",
      user: `postgres.${projectRef}`,
      password: serviceKey,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  },
  {
    name: "pooler transaction, postgres user, service key",
    config: {
      host: `aws-0-ap-southeast-1.pooler.supabase.com`,
      port: 6543,
      database: "postgres",
      user: `postgres.${projectRef}`,
      password: serviceKey,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  },
];

for (const c of candidates) {
  console.log(`\n--- ${c.name} ---`);
  const client = new Client(c.config);
  try {
    await client.connect();
    const r = await client.query("SELECT current_user, current_database();");
    console.log("OK:", r.rows);
    await client.end();
  } catch (e) {
    console.log("FAIL:", e.message.split("\n")[0]);
  }
}