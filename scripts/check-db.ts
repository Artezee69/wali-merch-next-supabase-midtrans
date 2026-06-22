import { createClient } from "@supabase/supabase-js";

const url = "https://agwihzjynhogczlmkfsx.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnd2loemp5bmhvZ2N6bG1rZnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc2MTA2NSwiZXhwIjoyMDk1MzM3MDY1fQ.MBGVSaScZIBd0xXnOKug3xgfVMQtMSznEoOW0sInRmY";
const db = createClient(url, key);

async function main() {
  // 1. Check store_settings keys
  const { data: settingsRows } = await db
    .from("store_settings")
    .select("key")
    .order("key");
  console.log("store_settings keys:", settingsRows?.map(r => r.key) ?? []);

  // 2. Check home_content keys
  const { data: homeRows } = await db
    .from("home_content")
    .select("key")
    .order("key");
  console.log("home_content keys:", homeRows?.map(r => r.key) ?? []);

  // 3. Check homepage_settings keys
  const { data: pageRows } = await db
    .from("homepage_settings")
    .select("key")
    .order("key");
  console.log("homepage_settings keys:", pageRows?.map(r => r.key) ?? []);

  // 4. Check products table
  const { data: prodRows } = await db
    .from("products")
    .select("id, name, price");
  console.log("products count:", prodRows?.length ?? 0);

  // 5. Check product_variants
  const { data: varRows } = await db
    .from("product_variants")
    .select("product_id, size");
  console.log("product_variants count:", varRows?.length ?? 0);
}

main().catch(console.error);
