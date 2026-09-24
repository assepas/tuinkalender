// Zet de bronbestanden in /data in de Supabase-database (upsert: bestaande
// rijen met hetzelfde id worden overschreven, andere blijven staan).
//
// Gebruikt de secret key, die RLS omzeilt — daarom draait dit alleen
// lokaal met SUPABASE_URL en SUPABASE_SECRET_KEY uit .env.local, en nooit
// in de browser. Valideer eerst: `npm run validate`.
//
// Gebruik: npm run db:seed

import { createClient } from "@supabase/supabase-js";
import { loadSpecies, loadRegionList, loadTaskTypesFile, loadLocalEnv, requireEnv } from "./lib/data-files.mjs";

loadLocalEnv();
const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false },
});

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${table}: ${rows.length} rij(en)`);
}

await upsert("species", loadSpecies().map((s) => ({ id: s.id, data: s })));
await upsert(
  "task_types",
  loadTaskTypesFile().types.map((t, i) => ({ id: t.id, sort: i, data: t }))
);
await upsert("regions", loadRegionList().map((r) => ({ id: r.id, data: r })));
