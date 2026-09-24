// Gedeelde leesfuncties voor de bronbestanden in /data. Gebruikt door
// build-species.mjs (bundelen in de app), seed-supabase.mjs (naar de
// database) en export-from-supabase.mjs (terug naar /data).

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
export const dataDir = path.join(root, "data");

export function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

export function loadSpecies() {
  const dir = path.join(dataDir, "species");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)))
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export function loadRegionList() {
  const dir = path.join(dataDir, "regions");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)));
}

export function loadTaskTypesFile() {
  return readJson(path.join(dataDir, "taskTypes.json"));
}

/**
 * Leest .env.local (als die er is) in process.env. Daar staan de
 * Supabase-URL en de secret key voor de beheerscripts — nooit in git
 * (zie *.local in .gitignore) en nooit in de client.
 */
export function loadLocalEnv() {
  try {
    process.loadEnvFile(path.join(root, ".env.local"));
  } catch {
    // Geen .env.local: dan moeten de variabelen al in de omgeving staan.
  }
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Omgevingsvariabele ${name} ontbreekt (zet hem in .env.local, zie .env.example).`);
    process.exit(1);
  }
  return value;
}
