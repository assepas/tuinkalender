// Pure hulpfuncties rond de plantencatalogus (soorten, taaktypes, regio's).
// Los van Svelte/Supabase zodat ze te testen zijn.

/** Zelfde sortering als scripts/build-species.mjs: op naam, Nederlands. */
export function sortSpecies(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

/**
 * Bouwt de catalogusvorm die de app gebruikt uit losse lijsten.
 * @param {{ species: object[], taskTypes: object[], regions: object[] }} parts
 */
export function buildCatalog({ species, taskTypes, regions }) {
  const speciesList = sortSpecies(species);
  return {
    speciesList,
    speciesIndex: Object.fromEntries(speciesList.map((s) => [s.id, s])),
    taskTypes,
    taskTypeIndex: Object.fromEntries(taskTypes.map((t) => [t.id, t])),
    regions: Object.fromEntries(regions.map((r) => [r.id, r])),
  };
}

/**
 * Zet de rijen uit de Supabase-tabellen om naar catalogus-delen. Geeft null
 * als de database (nog) leeg is — dan houden we de meegebakken data, i.p.v.
 * een app zonder soorten.
 */
export function catalogPartsFromRows({ species, taskTypes, regions }) {
  if (!species?.length || !taskTypes?.length || !regions?.length) return null;
  return {
    species: species.map((r) => r.data),
    taskTypes: [...taskTypes].sort((a, b) => a.sort - b.sort).map((r) => r.data),
    regions: regions.map((r) => r.data),
  };
}

/** Controleert of een uit localStorage gelezen cache de verwachte vorm heeft. */
export function isValidCatalogParts(parts) {
  return (
    !!parts &&
    Array.isArray(parts.species) &&
    Array.isArray(parts.taskTypes) &&
    Array.isArray(parts.regions) &&
    parts.species.length > 0 &&
    parts.taskTypes.length > 0 &&
    parts.regions.length > 0
  );
}
