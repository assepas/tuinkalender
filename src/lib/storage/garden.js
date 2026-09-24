// Repository rond het tuindocument in localStorage: de lokale tuin (zonder
// account) en de offline-kopie van de actieve cloudtuin (met account, zie
// cloudGarden.js voor de Supabase-kant). Die twee staan onder aparte
// sleutels, zodat inloggen of uitloggen de lokale tuin nooit overschrijft.

import { migrateGarden, createEmptyGarden } from "../domain/migrate.js";
import { makeId } from "../domain/id.js";

const STORAGE_KEY = "tuintaak:garden:v1";
// Los van het tuin-JSON opgeslagen (eigen sleutel), zodat dit tijdstip niet
// meekomt in een export/import — dat is metadata over déze browser, niet
// over de tuin zelf.
const LAST_EXPORTED_KEY = "tuintaak:lastExportedAt";
const CLOUD_CACHE_KEY = "tuintaak:cloudGarden:v1";
const DEFAULT_REGION = "nl-utrecht";

export function loadGarden() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyGarden(DEFAULT_REGION);

  try {
    const parsed = JSON.parse(raw);
    return migrateGarden(parsed);
  } catch (err) {
    console.error("[garden] kon opgeslagen tuin niet lezen, start met lege tuin:", err);
    return createEmptyGarden(DEFAULT_REGION);
  }
}

export function saveGarden(garden) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(garden));
}

/** Na uploaden naar een account: de lokale kopie is dan overbodig. */
export function clearLocalGarden() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportGardenAsJson(garden) {
  return JSON.stringify(garden, null, 2);
}

/** Parseert en migreert geïmporteerde JSON; gooit een leesbare fout bij ongeldige data. */
export function importGardenFromJson(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Dit is geen geldige JSON.");
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.plantings)) {
    throw new Error('Bestand mist een "plantings"-lijst — is dit een tuintaak-export?');
  }
  return migrateGarden(parsed);
}

export function makePlantingUid() {
  return makeId("p");
}

export function makeLocationId() {
  return makeId("loc");
}

/** Timestamp (ms) van de laatste export, of null als die er nog nooit was. */
export function getLastExportedAt() {
  const raw = localStorage.getItem(LAST_EXPORTED_KEY);
  if (!raw) return null;
  const timestamp = Number(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function setLastExportedAt(timestamp = Date.now()) {
  localStorage.setItem(LAST_EXPORTED_KEY, String(timestamp));
}

/**
 * Offline-kopie van de actieve cloudtuin, incl. de laatst bekende
 * serverversie (`base`, nodig om bij een conflict samen te voegen) en of er
 * nog niet-gesynchroniseerde wijzigingen zijn (`dirty`).
 * @returns {{ userId: string, gardenId: string, name: string, role: string, version: number,
 *             base: object, garden: object, dirty: boolean } | null}
 */
export function loadCloudCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY));
    if (!cache?.gardenId || !cache.garden || !cache.base) return null;
    return { ...cache, garden: migrateGarden(cache.garden), base: migrateGarden(cache.base) };
  } catch {
    return null;
  }
}

export function saveCloudCache(cache) {
  try {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn("[garden] kon offline-kopie niet opslaan:", err);
  }
}

/** Bij uitloggen: geen tuindata van dit account achterlaten op het apparaat. */
export function clearCloudCache() {
  localStorage.removeItem(CLOUD_CACHE_KEY);
}

export { DEFAULT_REGION };
