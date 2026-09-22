// Gedeelde id-generator. Puur en zonder browser-API's, dus bruikbaar vanuit
// zowel de domeinlaag (migrate.js, bij het aanmaken van standplaatsen tijdens
// een migratie) als lib/storage (dat al een makePlantingUid() had) — zonder
// dat storage/garden.js en domain/migrate.js elkaar circulair importeren.
export function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
