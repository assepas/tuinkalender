// Gedeelde, pure garden-vocab: standplaats-"soort plek" en soort-categorie.
// Puur en zonder browser-API's — gebruikt door de domeinlaag (calendar.js,
// migrate.js) én door componenten (soorten-combobox-groepering,
// filterchips in het tuinoverzicht), zodat er maar één plek is die deze
// lijstjes kent.

// Vast, klein vocabulaire voor het "soort plek"-label van een standplaats
// (los van de vrije naam die de gebruiker zelf kiest, bv. "Kas 1"). Dit
// houdt taak-condities (`conditions.position` in soortdata) betrouwbaar
// werkend ook al noemt de gebruiker zijn standplaatsen zelf. Nu gebruikt
// door precies één taak (tomaat "opbinden-dieven": kas/buiten) — "pot" is
// een bewuste voorbereiding op toekomstige soortdata/filtering, ook al
// matcht er nu nog geen taak-conditie op.
export const LOCATION_KINDS = ["kas", "buiten", "pot"];
export const LOCATION_KIND_LABELS = {
  kas: "Kas",
  buiten: "Buiten",
  pot: "Pot",
};

// Volgorde + labels voor species.category (vast enum in data/schema/species.schema.json).
export const CATEGORY_ORDER = ["groente", "fruit", "kruid", "vaste-plant", "bolgewas", "struik", "boom"];
export const CATEGORY_LABELS = {
  groente: "Groente",
  fruit: "Fruit",
  kruid: "Kruid",
  "vaste-plant": "Vaste plant",
  bolgewas: "Bolgewas",
  struik: "Struik",
  boom: "Boom",
};

/** @param {Array<{id: string}>} locations */
export function buildLocationIndex(locations) {
  return Object.fromEntries((locations ?? []).map((l) => [l.id, l]));
}

/**
 * Plantingen die dezelfde soort+standplaats-combinatie hebben. Lege array
 * als speciesId of locationId ontbreekt — "geen standplaats" telt niet als
 * dubbel, want meerdere nog-niet-ingedeelde planten van dezelfde soort is
 * heel normaal (je hebt je tuin simpelweg nog niet verder ingedeeld).
 *
 * @param {{ plantings: Array }} garden
 * @param {string} speciesId
 * @param {string|null|undefined} locationId
 * @param {string|null} [excludeUid]  planting die zelf niet meetelt (bij bewerken van een bestaande planting)
 */
export function findDuplicatePlantings(garden, speciesId, locationId, excludeUid = null) {
  if (!speciesId || !locationId) return [];
  return (garden.plantings ?? []).filter(
    (p) => p.speciesId === speciesId && p.locationId === locationId && p.uid !== excludeUid
  );
}
