// De kern van de app: buildCalendar(garden, speciesIndex, regionProfile)
// is een pure functie zonder side effects. Dezelfde input geeft altijd
// dezelfde 12-maands structuur terug — dat maakt hem triviaal te testen
// en herbruikbaar voor zowel de schermweergave als de printweergave.

import { evaluateWindow, monthsBetween } from "./windows.js";

const MONTH_NAMES = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

function conditionMatches(conditions, planting) {
  if (!conditions) return true;
  if (conditions.position && planting.position && !conditions.position.includes(planting.position)) {
    return false;
  }
  if (conditions.soil && planting.soil && !conditions.soil.includes(planting.soil)) {
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

  for (const planting of garden.plantings ?? []) {
    const species = speciesIndex[planting.speciesId];
    if (!species) continue; // verwijderde/onbekende soort: sla stil over i.p.v. crashen

    const muted = new Set(planting.mutedTasks ?? []);
    const tasks = [
      ...species.tasks.filter((t) => !muted.has(t.id)),
      ...(planting.extraTasks ?? []),
    ];

    for (const task of tasks) {
      if (!conditionMatches(task.conditions, planting)) continue;

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
 * Bouwt de rijen voor de tijdlijnweergave: per planting één rij met een
 * "lane" per informatiesoort (bloei + één lane per actief taaktype), elk met
 * de maanden waarin die lane speelt. Losstaand van buildCalendar() omdat de
 * tijdlijn per-plant/per-type geordend is, niet per-maand.
 *
 * @param {string[]} taskTypeOrder  taaktype-id's in de volgorde waarin lanes getoond moeten worden
 */
export function buildTimelineRows(garden, speciesIndex, taskTypeIndex, regionProfile, taskTypeOrder) {
  const orderIndex = new Map(taskTypeOrder.map((id, i) => [id, i]));
  const rows = [];

  for (const planting of garden.plantings ?? []) {
    const species = speciesIndex[planting.speciesId];
    if (!species) continue;

    const muted = new Set(planting.mutedTasks ?? []);
    const tasks = [
      ...species.tasks.filter((t) => !muted.has(t.id)),
      ...(planting.extraTasks ?? []),
    ].filter((t) => conditionMatches(t.conditions, planting));

    const lanes = [];

    const bloomMonths = getBloomMonths(species);
    if (bloomMonths) {
      lanes.push({
        kind: "bloom",
        months: bloomMonths,
        color: species.appearance?.flowerColor ?? "#8A8672",
      });
    }

    const byType = new Map();
    for (const task of tasks) {
      let evaluated;
      try {
        evaluated = evaluateWindow(task.window, regionProfile);
      } catch (err) {
        console.warn(`[timeline] kon taak "${task.id}" van "${species.id}" niet evalueren:`, err.message);
        continue;
      }
      const entry = { task, months: evaluated.months, frequency: evaluated.frequency ?? null };
      if (!byType.has(task.type)) byType.set(task.type, []);
      byType.get(task.type).push(entry);
    }

    const taskLanes = [...byType.entries()]
      .map(([type, entries]) => ({ kind: "task", taskType: type, meta: taskTypeIndex[type], entries }))
      .sort((a, b) => (orderIndex.get(a.taskType) ?? 99) - (orderIndex.get(b.taskType) ?? 99));

    lanes.push(...taskLanes);

    rows.push({ planting, species, lanes });
  }

  return rows;
}

export { MONTH_NAMES };
