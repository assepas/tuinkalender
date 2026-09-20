// Leest alle bronbestanden in /data en bundelt ze tot één ES-module in
// src/lib/generated/data.js. Dit is de enige plek waar het filesystem
// wordt aangeraakt — de rest van de app importeert gewoon een module.
//
// Draait via `npm run build:data` (voor dev en build, zie package.json).

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(root, "data");
const outDir = path.join(root, "src", "lib", "generated");

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

function loadSpecies() {
  const dir = path.join(dataDir, "species");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

function loadRegions() {
  const dir = path.join(dataDir, "regions");
  const list = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)));
  const byId = Object.fromEntries(list.map((r) => [r.id, r]));
  return byId;
}

const species = loadSpecies();
const taskTypes = readJson(path.join(dataDir, "taskTypes.json")).types;
const regions = loadRegions();

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
