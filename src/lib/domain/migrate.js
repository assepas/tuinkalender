// Migratieketen voor het tuindocument (het document dat in localStorage
// staat en dat je kunt exporteren/importeren als JSON).
//
// Er is nu nog maar één versie, maar de infrastructuur staat klaar:
// als het schema ooit verandert, komt er een migratiefunctie bij deze
// `migrations`-map (sleutel = versie waar de migratie VANAF gaat) en
// hoeft de rest van de app niet te weten dat oude data ooit anders was.

export const CURRENT_GARDEN_VERSION = 1;

/** @type {Record<number, (doc: object) => object>} */
const migrations = {
  // Voorbeeld voor de toekomst:
  // 1: (doc) => ({ ...doc, schemaVersion: 2, plantings: doc.plantings.map(...) }),
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
  return {
    schemaVersion: CURRENT_GARDEN_VERSION,
    region: regionId,
    plantings: [],
  };
}
