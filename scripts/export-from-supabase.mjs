// Haalt de catalogus uit Supabase terug naar /data, zodat wijzigingen die
// via de app zijn gedaan ook in git staan (back-up + actuele meegebakken
// fallback bij de volgende build). Schrijft alleen; soorten die in de
// database verwijderd zijn, worden hier als bestand verwijderd.
//
// Gebruik: npm run db:export  (daarna `git diff data/` om te bekijken)

import { writeFileSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { dataDir, loadTaskTypesFile, loadLocalEnv, requireEnv } from "./lib/data-files.mjs";

loadLocalEnv();
const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false },
});

async function fetchAll(table, order = "id") {
  const { data, error } = await supabase.from(table).select("*").order(order);
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    process.exit(1);
  }
  return data;
}

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

const species = await fetchAll("species");
const speciesDir = path.join(dataDir, "species");
const keep = new Set(species.map((s) => `${s.id}.json`));
for (const s of species) writeJson(path.join(speciesDir, `${s.id}.json`), s.data);
for (const f of readdirSync(speciesDir)) {
  if (f.endsWith(".json") && !keep.has(f)) {
    unlinkSync(path.join(speciesDir, f));
    console.log(`  verwijderd: species/${f}`);
  }
}
console.log(`✓ species: ${species.length}`);

const taskTypes = await fetchAll("task_types", "sort");
const taskTypesFile = loadTaskTypesFile();
writeJson(path.join(dataDir, "taskTypes.json"), { ...taskTypesFile, types: taskTypes.map((t) => t.data) });
console.log(`✓ task_types: ${taskTypes.length}`);

const regions = await fetchAll("regions");
for (const r of regions) writeJson(path.join(dataDir, "regions", `${r.id}.json`), r.data);
console.log(`✓ regions: ${regions.length}`);
