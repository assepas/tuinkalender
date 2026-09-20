// Valideert alle bronbestanden in /data tegen hun JSON Schema.
// Draait vóór elke build (`npm run build`) en kan los als `npm run validate`.
// Dit is het vangnet dat een nieuw soort-bestand met een tikfout tegenhoudt
// vóórdat het de app bereikt.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv from "ajv";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(root, "data");
const schemaDir = path.join(dataDir, "schema");

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

const ajv = new Ajv({ allErrors: true, strict: false });

const speciesSchema = ajv.compile(readJson(path.join(schemaDir, "species.schema.json")));
const regionSchema = ajv.compile(readJson(path.join(schemaDir, "region.schema.json")));

let errorCount = 0;

function check(validator, file, data) {
  const ok = validator(data);
  if (!ok) {
    errorCount++;
    console.error(`\n✗ ${file}`);
    for (const err of validator.errors) {
      console.error(`  ${err.instancePath || "(root)"} ${err.message}`);
    }
  }
}

// Soorten
const speciesFiles = readdirSync(path.join(dataDir, "species")).filter((f) => f.endsWith(".json"));
const seenIds = new Map();
for (const f of speciesFiles) {
  const full = path.join(dataDir, "species", f);
  const data = readJson(full);
  check(speciesSchema, `species/${f}`, data);

  if (seenIds.has(data.id)) {
    errorCount++;
    console.error(`\n✗ species/${f}\n  id "${data.id}" is al gebruikt in ${seenIds.get(data.id)}`);
  }
  seenIds.set(data.id, f);

  // Taaktypes moeten bestaan in taskTypes.json (los gecheckt hieronder)
}

// Regio's
const regionFiles = readdirSync(path.join(dataDir, "regions")).filter((f) => f.endsWith(".json"));
for (const f of regionFiles) {
  check(regionSchema, `regions/${f}`, readJson(path.join(dataDir, "regions", f)));
}

// Kruisreferentie: elk taaktype dat een soort gebruikt, moet in taskTypes.json staan
const taskTypeIds = new Set(readJson(path.join(dataDir, "taskTypes.json")).types.map((t) => t.id));
for (const f of speciesFiles) {
  const data = readJson(path.join(dataDir, "species", f));
  for (const task of data.tasks) {
    if (!taskTypeIds.has(task.type)) {
      errorCount++;
      console.error(
        `\n✗ species/${f}\n  taak "${task.id}" gebruikt onbekend type "${task.type}" (niet in data/taskTypes.json)`
      );
    }
  }
}

if (errorCount > 0) {
  console.error(`\n${errorCount} validatiefout(en) gevonden.\n`);
  process.exit(1);
} else {
  console.log(
    `✓ ${speciesFiles.length} soorten, ${regionFiles.length} regio('s) en taaktypes zijn geldig.`
  );
}
