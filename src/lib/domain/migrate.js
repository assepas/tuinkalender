// Migratieketen voor het tuindocument (het document dat in localStorage
// staat en dat je kunt exporteren/importeren als JSON).
//
// De `migrations`-map (sleutel = versie waar de migratie VANAF gaat) zorgt
// dat de rest van de app niet hoeft te weten dat oude data ooit anders was.

import { makeId } from "./id.js";
import { LOCATION_KINDS } from "./plantings.js";

export const CURRENT_GARDEN_VERSION = 3;

/** Beginwaarde van de standaardstandplaats: fallback voor plantingen zonder (geldige) standplaats. */
export function createDefaultLocation() {
  return { id: makeId("loc"), name: "Buiten", kind: "buiten" };
}

/** @type {Record<number, (doc: object) => object>} */
const migrations = {
  // v1 -> v2: standplaats en grondsoort waren vrije tekst per planting
  // (`position`/`soil`). Vanaf hier zijn standplaatsen eigen, herbruikbare
  // objecten (`garden.locations`) met een vrije naam en een optioneel vast
  // "soort plek"-label (`kind`) — plantingen verwijzen ernaar via
  // `locationId`. Per unieke, niet-lege legacy `position`-waarde komt er
  // precies één Location; meerdere plantingen met dezelfde tekst delen 'm.
  1: (doc) => {
    const legacyPlantings = doc.plantings ?? [];
    const locationsByPosition = new Map(); // exacte legacy position-string -> nieuwe Location

    for (const p of legacyPlantings) {
      const position = (p.position ?? "").trim();
      if (!position) continue; // geen standplaats: niets om te migreren (en dus ook geen plek voor een evt. soil)

      let location = locationsByPosition.get(position);
      if (!location) {
        const kind = LOCATION_KINDS.includes(position.toLowerCase()) ? position.toLowerCase() : undefined;
        location = { id: makeId("loc"), name: position, ...(kind ? { kind } : {}) };
        locationsByPosition.set(position, location);
      }
      // Eerste niet-lege soil die we bij deze positie tegenkomen wint.
      if (p.soil && !location.soil) location.soil = p.soil;
    }

    const plantings = legacyPlantings.map(({ position, soil, ...rest }) => {
      const trimmed = (position ?? "").trim();
      const location = trimmed ? locationsByPosition.get(trimmed) : null;
      return { ...rest, locationId: location ? location.id : null };
    });

    return {
      ...doc,
      schemaVersion: 2,
      locations: [...locationsByPosition.values()],
      plantings,
    };
  },

  // v2 -> v3: "geen standplaats" bestaat niet meer. Elke tuin heeft een
  // standaardstandplaats (`defaultLocationId`, door de gebruiker te kiezen);
  // plantingen zonder of met een onbekende locationId komen daarop. Een
  // bestaande standplaats die al "Buiten" heet wordt hergebruikt i.p.v. een
  // tweede aan te maken.
  2: (doc) => {
    let locations = doc.locations ?? [];
    let defaultLocation = locations.find((l) => l.name.trim().toLowerCase() === "buiten");
    if (!defaultLocation) {
      defaultLocation = createDefaultLocation();
      locations = [defaultLocation, ...locations];
    }
    const knownIds = new Set(locations.map((l) => l.id));
    const plantings = (doc.plantings ?? []).map((p) =>
      knownIds.has(p.locationId) ? p : { ...p, locationId: defaultLocation.id }
    );

    return {
      ...doc,
      schemaVersion: 3,
      locations,
      defaultLocationId: defaultLocation.id,
      plantings,
    };
  },
};

export function migrateGarden(doc) {
  let current = doc;
  let guard = 0;

  while (current.schemaVersion < CURRENT_GARDEN_VERSION) {
    const migrate = migrations[current.schemaVersion];
    if (!migrate) {
      throw new Error(
        `Geen migratiepad van tuinversie ${current.schemaVersion} naar ${CURRENT_GARDEN_VERSION}.`
      );
    }
    current = migrate(current);

    if (++guard > 50) {
      throw new Error("Migratieketen lijkt oneindig te lopen — controleer migrate.js.");
    }
  }

  if (current.schemaVersion > CURRENT_GARDEN_VERSION) {
    throw new Error(
      `Tuindocument heeft versie ${current.schemaVersion}, nieuwer dan wat deze app kent (${CURRENT_GARDEN_VERSION}). Update de app.`
    );
  }

  return current;
}

export function createEmptyGarden(regionId) {
  const defaultLocation = createDefaultLocation();
  return {
    schemaVersion: CURRENT_GARDEN_VERSION,
    region: regionId,
    locations: [defaultLocation],
    defaultLocationId: defaultLocation.id,
    plantings: [],
  };
}
