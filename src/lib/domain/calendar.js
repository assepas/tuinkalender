// De kern van de app: buildCalendar(garden, speciesIndex, regionProfile)
// is een pure functie zonder side effects. Dezelfde input geeft altijd
// dezelfde 12-maands structuur terug — dat maakt hem triviaal te testen
// en herbruikbaar voor zowel de schermweergave als de printweergave.

import { evaluateWindow, monthsBetween } from "./windows.js";
import { buildLocationIndex } from "./plantings.js";

const MONTH_NAMES = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

// `locationIndex` komt uit buildLocationIndex(garden.locations) — condities
// matchen op het "soort plek"-label (kind) en de grondsoort van de
// standplaats, niet meer op vrije tekst op de planting zelf. Een
// onopgeloste locationId (verwijderde standplaats) levert `undefined` op:
// de conditie faalt dan stil (geen match), net als vroeger bij een lege
// planting.position/.soil — geen crash, geen verrassend wél-matchen.
function conditionMatches(conditions, planting, locationIndex) {
  if (!conditions) return true;
  const location = locationIndex[planting.locationId];
  if (conditions.position && location?.kind && !conditions.position.includes(location.kind)) {
    return false;
  }
  if (conditions.soil && location?.soil && !conditions.soil.includes(location.soil)) {
    return false;
  }
  return true;
}

/**
 * @param {{ plantings: Array }} garden
 * @param {Record<string, object>} speciesIndex  id -> species
 * @param {object} regionProfile  regio uit data/regions
 * @returns {Array<{ month: number, name: string, entries: Array }>}
 */
export function buildCalendar(garden, speciesIndex, regionProfile) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    name: MONTH_NAMES[i],
    entries: [],
  }));
  const locationIndex = buildLocationIndex(garden.locations);

  for (const planting of garden.plantings ?? []) {
    const species = speciesIndex[planting.speciesId];
    if (!species) continue; // verwijderde/onbekende soort: sla stil over i.p.v. crashen

    const muted = new Set(planting.mutedTasks ?? []);
    const tasks = [
      ...species.tasks.filter((t) => !muted.has(t.id)),
      ...(planting.extraTasks ?? []),
    ];

    for (const task of tasks) {
      if (!conditionMatches(task.conditions, planting, locationIndex)) continue;

      let evaluated;
      try {
        evaluated = evaluateWindow(task.window, regionProfile);
      } catch (err) {
        // Eén kapotte taak mag de rest van de kalender niet meeslepen.
        console.warn(`[calendar] kon taak "${task.id}" van "${species.id}" niet evalueren:`, err.message);
        continue;
      }

      for (const monthNum of evaluated.months) {
        months[monthNum - 1].entries.push({
          plantingUid: planting.uid,
          speciesId: species.id,
          speciesName: species.name,
          label: planting.label || species.name,
          taskId: task.id,
          taskType: task.type,
          note: task.note ?? null,
          frequency: evaluated.frequency ?? null,
          isCustom: !species.tasks.includes(task),
        });
      }
    }
  }

  for (const month of months) {
    month.entries.sort(
      (a, b) =>
        a.taskType.localeCompare(b.taskType, "nl") ||
        a.speciesName.localeCompare(b.speciesName, "nl") ||
        a.label.localeCompare(b.label, "nl")
    );
  }

  return months;
}

/**
 * Bloei is puur informatief (geen taak) en staat daarom los van tasks/window-
 * evaluatie. Geeft null als de soort geen bloom-data heeft.
 */
export function getBloomMonths(species) {
  if (!species?.bloom) return null;
  return monthsBetween(species.bloom.from, species.bloom.to);
}

/**
 * Een taak kan binnen één taaktype een variant hebben (zaaien: kas/grond,
 * snoeien: hoofd/licht). De variant geeft een eigen label/icoon; de
 * kleur blijft die van het taaktype. Zonder variantBy is er één "variant"
 * (het taaktype zelf).
 */
function resolveMarkerMeta(task, typeMeta) {
  const key = typeMeta.variantBy ? (task[typeMeta.variantBy] ?? typeMeta.defaultVariant) : null;
  const variant = key ? typeMeta.variants?.[key] : null;
  const variantOrder = key ? Object.keys(typeMeta.variants ?? {}).indexOf(key) : 0;
  return {
    variantKey: key,
    variantOrder,
    meta: { ...typeMeta, ...variant },
  };
}

/**
 * Bouwt de rijen voor de tijdlijnweergave: per planting één rij met de
 * bloeiperiode (een doorlopende balk) en per maand de taak-markers die daar
 * overheen komen. Elke soort komt maar één keer voor (de eerste planting wint). Losstaand van buildCalendar() omdat de tijdlijn per plant
 * is opgebouwd, niet per maand.
 *
 * @param {string[]} taskTypeOrder  taaktype-id's die getoond worden, in de volgorde waarin markers
 *   binnen één maand naast elkaar komen. Taaktypes die hier niet in staan blijven weg.
 * @returns {Array<{ planting: object, species: object, bloom: { months: number[], color: string } | null,
 *   bars: Array<{ taskType: string, meta: object, months: number[], entries: object[] }>,
 *   cells: Array<Array<{ taskType: string, variantKey: string | null, meta: object, entry: object }>> }>}
 *   `cells[m - 1]` zijn de markers van maand `m`. `bars` zijn taaktypes met
 *   `markerStyle: "bar"` (zie buildCalendar-header en README) — die staan
 *   los van `cells`, als doorlopende balk over hun actieve maanden.
 */
export function buildTimelineRows(garden, speciesIndex, taskTypeIndex, regionProfile, taskTypeOrder) {
  const orderIndex = new Map(taskTypeOrder.map((id, i) => [id, i]));
  const locationIndex = buildLocationIndex(garden.locations);
  const rows = [];
  const seenSpecies = new Set();

  for (const planting of garden.plantings ?? []) {
    const species = speciesIndex[planting.speciesId];
    if (!species) continue;

    // Elke soort maar één keer: bij meerdere plantingen van dezelfde soort telt de eerste.
    if (seenSpecies.has(species.id)) continue;
    seenSpecies.add(species.id);

    const muted = new Set(planting.mutedTasks ?? []);
    const tasks = [
      ...species.tasks.filter((t) => !muted.has(t.id)),
      ...(planting.extraTasks ?? []),
    ].filter((t) => orderIndex.has(t.type) && conditionMatches(t.conditions, planting, locationIndex));

    const bloomMonths = getBloomMonths(species);
    const bloom = bloomMonths
      ? { months: bloomMonths, color: species.appearance?.flowerColor ?? "#8A8672" }
      : null;

    const cells = Array.from({ length: 12 }, () => []);
    const barsByType = new Map();

    for (const task of tasks) {
      let evaluated;
      try {
        evaluated = evaluateWindow(task.window, regionProfile);
      } catch (err) {
        console.warn(`[timeline] kon taak "${task.id}" van "${species.id}" niet evalueren:`, err.message);
        continue;
      }
      const typeMeta = taskTypeIndex[task.type];
      if (!typeMeta) continue;

      const entry = { task, months: evaluated.months, frequency: evaluated.frequency ?? null };

      // Taaktypes met markerStyle "bar" (bv. oogsten) krijgen één doorlopende
      // balk in plaats van een icoontje per maand — anders levert een taak
      // die maandenlang loopt een wand van identieke icoontjes op. Meerdere
      // taken van hetzelfde type (zeldzaam) smelten samen tot één balk.
      if (typeMeta.markerStyle === "bar") {
        const bar = barsByType.get(task.type);
        if (bar) {
          for (const m of evaluated.months) bar.months.add(m);
          bar.entries.push(entry);
        } else {
          barsByType.set(task.type, {
            taskType: task.type,
            meta: typeMeta,
            months: new Set(evaluated.months),
            entries: [entry],
          });
        }
        continue;
      }

      const { variantKey, variantOrder, meta } = resolveMarkerMeta(task, typeMeta);
      for (const m of evaluated.months) {
        cells[m - 1].push({ taskType: task.type, variantKey, variantOrder, meta, entry });
      }
    }

    for (const cell of cells) {
      cell.sort(
        (a, b) => orderIndex.get(a.taskType) - orderIndex.get(b.taskType) || a.variantOrder - b.variantOrder
      );
    }

    const bars = [...barsByType.values()].map((bar) => ({
      ...bar,
      months: [...bar.months].sort((a, b) => a - b),
    }));

    rows.push({ planting, species, bloom, bars, cells });
  }

  return rows;
}

export { MONTH_NAMES };
