// Repository rond het tuindocument. Dit is de enige module die
// localStorage aanraakt — als je dit ooit vervangt door bv. een synced
// backend, verandert alleen dit bestand.

import { migrateGarden, createEmptyGarden } from "../domain/migrate.js";

const STORAGE_KEY = "tuinkalender:garden:v1";
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
    throw new Error('Bestand mist een "plantings"-lijst — is dit een tuinkalender-export?');
  }
  return migrateGarden(parsed);
}

export function makePlantingUid() {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

export { DEFAULT_REGION };
