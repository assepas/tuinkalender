// Uitgebreid zoeken in de plantendatabase (SpeciesFinder.svelte): op naam,
// groeiomstandigheden, bloei, type en tags. Puur, zonder browser-API's.
//
// Binnen één filtergroep is het OF (zon óf halfschaduw), tussen groepen EN.
// Tags zijn de uitzondering: "vlinderplant" + "eetbaar" betekent allebei.

import { getBloomMonths } from "./calendar.js";
import { compareByKey, matchesCategories, normalizeSoil } from "./plantings.js";

// De bloemkleurnamen in de data zijn vrij ("wit-roze", "crèmewit", "lila").
// Voor het filter vallen ze via trefwoorden in een handvol families; een
// samengestelde naam hoort bij elke familie die erin voorkomt.
export const COLOR_FAMILIES = [
  { id: "wit", label: "Wit", swatch: "#f4f1e6", words: ["wit", "crème", "creme"] },
  { id: "geel", label: "Geel", swatch: "#e8c63a", words: ["geel"] },
  { id: "oranje", label: "Oranje", swatch: "#e48a2c", words: ["oranje"] },
  { id: "rood", label: "Rood", swatch: "#c23b30", words: ["rood"] },
  { id: "roze", label: "Roze", swatch: "#e895b4", words: ["roze"] },
  { id: "paars", label: "Paars", swatch: "#8e5bb5", words: ["paars", "lila", "magenta", "violet"] },
  { id: "blauw", label: "Blauw", swatch: "#4f7fc9", words: ["blauw"] },
  { id: "groen", label: "Groen", swatch: "#86a95a", words: ["groen"] },
];

// Herkomst t.o.v. de Nederlandse flora (species.nativeStatus).
export const NATIVE_ORDER = ["inheems", "archeofyt", "exoot", "onbekend"];
export const NATIVE_LABELS = { inheems: "Inheems", archeofyt: "Archeofyt", exoot: "Exoot", onbekend: "Onbekend" };
export const NATIVE_HINTS = {
  inheems: "Komt van nature in Nederland voor",
  archeofyt: "Al vóór 1500 met de mens meegekomen en hier ingeburgerd",
  exoot: "Van oorsprong uit een ander gebied",
  onbekend: "Herkomst onbekend of verzamelnaam van meerdere soorten",
};

// Grootteklassen op de eindhoogte (species.growing.height). Een soort hoort
// bij elke klasse die zijn hoogte van–tot raakt: 60–120 cm is middel én hoog.
export const SIZE_CLASSES = [
  { id: "laag", label: "Laag", hint: "tot 40 cm", from: 0, to: 40 },
  { id: "middel", label: "Middel", hint: "40 cm – 1 m", from: 40, to: 100 },
  { id: "hoog", label: "Hoog", hint: "1 – 2,5 m", from: 100, to: 250 },
  { id: "zeer-hoog", label: "Zeer hoog", hint: "boven 2,5 m", from: 250, to: Infinity },
];

/** @returns {string[]} id's van de grootteklassen van deze soort (leeg zonder hoogte) */
export function sizeClasses(species) {
  const height = species?.growing?.height;
  if (!height) return [];
  return SIZE_CLASSES.filter((c) => height.minCm < c.to && height.maxCm > c.from).map((c) => c.id);
}

/** @returns {string[]} id's van de kleurfamilies van de bloemkleur van deze soort */
export function colorFamilies(species) {
  const name = (species?.appearance?.flowerColorName ?? "").toLowerCase();
  if (!name) return [];
  return COLOR_FAMILIES.filter((f) => f.words.some((w) => name.includes(w))).map((f) => f.id);
}

export function emptyFilters() {
  return {
    query: "",
    sun: new Set(),
    soil: new Set(),
    moisture: new Set(),
    colors: new Set(),
    months: new Set(),
    categories: new Set(),
    native: new Set(),
    size: new Set(),
    tags: new Set(),
  };
}

/** Aantal actieve filters (de zoekterm niet meegeteld). */
export function countActiveFilters(filters) {
  return ["sun", "soil", "moisture", "colors", "months", "categories", "native", "size", "tags"].reduce(
    (n, key) => n + filters[key].size,
    0
  );
}

const anyOf = (selected, values) => selected.size === 0 || (values ?? []).some((v) => selected.has(v));

/**
 * @param {Array<object>} speciesList
 * @param {ReturnType<typeof emptyFilters>} filters
 */
export function searchSpecies(speciesList, filters) {
  const q = filters.query.trim().toLowerCase();
  const result = speciesList.filter((s) => {
    if (
      q &&
      !s.name.toLowerCase().includes(q) &&
      !(s.latin ?? "").toLowerCase().includes(q) &&
      !(s.tags ?? []).some((t) => t.toLowerCase().includes(q))
    ) {
      return false;
    }
    if (!matchesCategories(s, filters.categories)) return false;
    if (filters.native.size > 0 && !filters.native.has(s.nativeStatus ?? "onbekend")) return false;
    if (!anyOf(filters.sun, s.growing?.sun)) return false;
    if (!anyOf(filters.soil, s.growing?.soil)) return false;
    if (!anyOf(filters.moisture, s.growing?.moisture)) return false;
    if (filters.colors.size > 0 && !anyOf(filters.colors, colorFamilies(s))) return false;
    if (filters.size.size > 0 && !anyOf(filters.size, sizeClasses(s))) return false;
    if (filters.months.size > 0 && !anyOf(filters.months, getBloomMonths(s))) return false;
    for (const tag of filters.tags) {
      if (!(s.tags ?? []).includes(tag)) return false;
    }
    return true;
  });
  return result.sort(compareByKey((s) => s.name));
}

/** Alle tags in de lijst, de meest voorkomende eerst. */
export function tagOptions(speciesList) {
  const counts = new Map();
  for (const s of speciesList) {
    for (const tag of s.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a, na], [b, nb]) => nb - na || a.localeCompare(b, "nl"))
    .map(([tag]) => tag);
}

/** Licht/grond/vocht van een standplaats als beginfilters (alleen wat is ingevuld). */
export function filtersForLocation(location) {
  const soil = normalizeSoil(location?.soil);
  return {
    sun: new Set(location?.sun ? [location.sun] : []),
    soil: new Set(soil ? [soil] : []),
    moisture: new Set(location?.moisture ? [location.moisture] : []),
  };
}
