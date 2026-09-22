// Bepaalt of de "exporteer eens een back-up"-waarschuwing getoond moet
// worden. Puur en zonder side effects: de tijdstippen komen van buitenaf
// binnen (localStorage zit in lib/storage/garden.js), hier wordt alleen
// het verschil beoordeeld.

export const BACKUP_REMINDER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {number|null} lastExportedAt  Timestamp (ms) van de laatste export, of null als die er nog nooit was.
 * @param {number} now                  Timestamp (ms) "nu" — override voor tests.
 * @param {number} thresholdDays        Na hoeveel dagen zonder export gewaarschuwd wordt.
 */
export function shouldWarnAboutBackup(lastExportedAt, now = Date.now(), thresholdDays = BACKUP_REMINDER_DAYS) {
  if (lastExportedAt == null) return true;
  return now - lastExportedAt > thresholdDays * DAY_MS;
}
