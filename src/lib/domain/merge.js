// Drieweg-samenvoegen van het tuindocument, voor als twee apparaten of
// mede-tuiniers tegelijk dezelfde tuin bewerken (zie cloudGarden.js).
//
// `base` is de laatste serverversie die dit apparaat kende, `mine` de lokale
// versie met eigen wijzigingen, `theirs` de nieuwere serverversie. Omdat
// plantingen en standplaatsen een vaste id hebben, kan dat per item:
// - alleen ik wijzigde → mijn versie; alleen zij → hun versie;
// - allebei gewijzigd → mijn versie (ik zit er nu naar te kijken);
// - verwijderd aan de ene kant en ongewijzigd aan de andere → weg;
// - verwijderd aan de ene kant maar gewijzigd aan de andere → blijft
//   (liever een plant te veel dan een bewerking kwijt).

/** Diepe gelijkheid die de sleutelvolgorde negeert (jsonb in Postgres herschikt sleutels). */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  const keysA = Object.keys(a).filter((k) => a[k] !== undefined);
  const keysB = Object.keys(b).filter((k) => b[k] !== undefined);
  return keysA.length === keysB.length && keysA.every((k) => deepEqual(a[k], b[k]));
}

function mergeValue(base, mine, theirs) {
  return deepEqual(mine, base) ? theirs : mine;
}

function mergeList(baseList = [], mineList = [], theirsList = [], key) {
  const baseMap = new Map(baseList.map((x) => [x[key], x]));
  const mineMap = new Map(mineList.map((x) => [x[key], x]));
  const theirsIds = new Set(theirsList.map((x) => x[key]));
  const result = [];

  // Volgorde van de server aanhouden; eigen nieuwe items komen achteraan.
  for (const theirs of theirsList) {
    const id = theirs[key];
    const base = baseMap.get(id);
    const mine = mineMap.get(id);
    if (mine) {
      result.push(base && deepEqual(mine, base) ? theirs : mine);
    } else if (!base || !deepEqual(theirs, base)) {
      // Nieuw bij hen, of ik verwijderde iets dat zij intussen wijzigden.
      result.push(theirs);
    }
  }

  for (const mine of mineList) {
    const id = mine[key];
    if (theirsIds.has(id)) continue;
    const base = baseMap.get(id);
    // Nieuw bij mij, of zij verwijderden iets dat ik intussen wijzigde.
    if (!base || !deepEqual(mine, base)) result.push(mine);
  }

  return result;
}

/**
 * @param {object | null} base  laatst bekende serverversie (null: geen gemeenschappelijke basis)
 * @param {object} mine
 * @param {object} theirs
 * @returns {object} samengevoegd tuindocument
 */
export function mergeGardens(base, mine, theirs) {
  // Zonder basis is niet te zeggen wie wat veranderde: dan telt elk verschil
  // als lokale wijziging en gaat er aan beide kanten niets verloren.
  base ??= theirs;

  const merged = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(mine), ...Object.keys(theirs)]);
  for (const k of keys) {
    if (k === "plantings" || k === "locations") continue;
    const value = mergeValue(base[k], mine[k], theirs[k]);
    if (value !== undefined) merged[k] = value;
  }
  merged.locations = mergeList(base.locations, mine.locations, theirs.locations, "id");
  merged.plantings = mergeList(base.plantings, mine.plantings, theirs.plantings, "uid");

  return repairReferences(merged);
}

/**
 * Na samenvoegen kan een verwijzing naar een (door de ander) verwijderde
 * standplaats blijven hangen. Zelfde regel als removeLocation in de app:
 * zulke plantingen gaan naar de standaardstandplaats.
 */
function repairReferences(garden) {
  const locationIds = new Set(garden.locations.map((l) => l.id));
  if (!locationIds.has(garden.defaultLocationId) && garden.locations.length > 0) {
    garden.defaultLocationId = garden.locations[0].id;
  }
  garden.plantings = garden.plantings.map((p) =>
    locationIds.has(p.locationId) ? p : { ...p, locationId: garden.defaultLocationId ?? null }
  );
  return garden;
}
