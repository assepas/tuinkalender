// Leest alle bronbestanden in /data en bundelt ze tot één ES-module in
// src/lib/generated/data.js. Samen met scripts/lib/data-files.mjs de enige
// plek die /data leest — de app importeert gewoon een module. Dit is de
// meegebakken fallback; de actuele catalogus komt uit Supabase (catalog.svelte.js).
//
// Draait via `npm run build:data` (voor dev en build, zie package.json).

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { root, loadSpecies, loadRegionList, loadTaskTypesFile } from "./lib/data-files.mjs";

const outDir = path.join(root, "src", "lib", "generated");

const species = loadSpecies();
const taskTypes = loadTaskTypesFile().types;
const regions = Object.fromEntries(loadRegionList().map((r) => [r.id, r]));

const speciesIds = new Set();
for (const s of species) {
  if (speciesIds.has(s.id)) {
    throw new Error(`Dubbel species-id gevonden: "${s.id}"`);
  }
  speciesIds.add(s.id);
}

mkdirSync(outDir, { recursive: true });

const banner = `// Automatisch gegenereerd door scripts/build-species.mjs — niet handmatig bewerken.\n// Bewerk in plaats daarvan de bronbestanden onder /data en draai \`npm run build:data\`.\n`;

const body =
  banner +
  `export const speciesList = ${JSON.stringify(species, null, 2)};\n\n` +
  `export const speciesIndex = Object.fromEntries(speciesList.map((s) => [s.id, s]));\n\n` +
  `export const taskTypes = ${JSON.stringify(taskTypes, null, 2)};\n\n` +
  `export const taskTypeIndex = Object.fromEntries(taskTypes.map((t) => [t.id, t]));\n\n` +
  `export const regions = ${JSON.stringify(regions, null, 2)};\n`;

writeFileSync(path.join(outDir, "data.js"), body);

console.log(
  `[build-species] ${species.length} soorten, ${taskTypes.length} taaktypes, ${Object.keys(regions).length} regio's -> src/lib/generated/data.js`
);
