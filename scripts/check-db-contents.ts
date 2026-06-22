import { createClient } from "@supabase/supabase-js";

const db = createClient(
  "https://agwihzjynhogczlmkfsx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnd2loemp5bmhvZ2N6bG1rZnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc2MTA2NSwiZXhwIjoyMDk1MzM3MDY1fQ.MBGVSaScZIBd0xXnOKug3xgfVMQtMSznEoOW0sInRmY"
);

async function main() {
  const { data, error } = await db
    .from("store_settings")
    .select("key, value")
    .order("key");

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  for (const row of data ?? []) {
    console.log(`\n=== ${row.key} ===`);
    console.log(row.value ? String(row.value).slice(0, 500) : "(empty)");
  }
}

main().catch(console.error);
