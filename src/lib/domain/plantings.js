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

// Gedeelde filter-/sorteerhulpen voor plantingsrijen — gebruikt door zowel
// "Mijn tuin" (GardenEditor.svelte, rijen {planting, species, location}) als
// de Tijdlijn (TimelineView.svelte, de rijkere buildTimelineRows()-rijen).
// Beide rij-vormen hebben altijd `planting` en `species`, dus filteren kan
// generiek; sorteren krijgt een key-extractor mee omdat "standplaats" per
// aanroeper anders wordt opgezocht (rechtstreeks vs. via een locationIndex).

/** Toggle een waarde in een Set zonder de gegeven Set te muteren — Svelte 5
 * runes reageren op reassignment, niet op Set.add/delete in-place. */
export function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** NL-collator-sortcomparator, geparametriseerd met een key-extractor.
 * @param {(row: object) => string} keyFor
 * @param {"asc"|"desc"} [dir]
 */
export function compareByKey(keyFor, dir = "asc") {
  const collator = new Intl.Collator("nl");
  const sign = dir === "desc" ? -1 : 1;
  return (a, b) => sign * collator.compare(keyFor(a), keyFor(b));
}

/**
 * Filtert rijen (die minimaal `{ planting, species }` bevatten) op
 * standplaats-id en soort-categorie. Beide filters zijn AND-gecombineerd;
 * een lege Set betekent "geen filter op deze dimensie". Een rij zonder
 * `species` (verwijderde soort) of zonder `planting.locationId` (nog geen
 * standplaats) valt weg zodra het bijbehorende filter actief is.
 *
 * @param {Array<{planting: object, species: object}>} rows
 * @param {Set<string>} locationIds
 * @param {Set<string>} categories
 */
export function filterPlantingRows(rows, locationIds, categories) {
  let result = rows;
  if (locationIds.size > 0) {
    result = result.filter((r) => r.planting.locationId && locationIds.has(r.planting.locationId));
  }
  if (categories.size > 0) {
    result = result.filter((r) => r.species && categories.has(r.species.category));
  }
  return result;
}
