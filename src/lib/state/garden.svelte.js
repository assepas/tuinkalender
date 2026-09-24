// Reactieve wrapper rond de garden-repository met Svelte 5 runes.
// Componenten importeren `gardenState` en lezen/schrijven daarop; niemand
// anders dan dit bestand roept saveGarden() aan, dus persistenties blijft
// op één plek gegarandeerd.

import {
  loadGarden,
  saveGarden,
  exportGardenAsJson,
  importGardenFromJson,
  makePlantingUid,
  makeLocationId,
  getLastExportedAt,
  setLastExportedAt,
} from "../storage/garden.js";
import { shouldWarnAboutBackup } from "../domain/backup.js";
import { createEmptyGarden } from "../domain/migrate.js";
import { findDuplicatePlantings, reassignPlantings } from "../domain/plantings.js";
import { speciesIndex, regions } from "../generated/data.js";

function createGardenState() {
  let garden = $state(loadGarden());
  let lastExportedAt = $state(getLastExportedAt());

  function persist() {
    saveGarden(garden);
  }

  return {
    get garden() {
      return garden;
    },
    get plantings() {
      return garden.plantings;
    },
    get locations() {
      return garden.locations ?? [];
    },
    /** Standaardstandplaats: voor nieuwe plantingen en als fallback bij verwijderen. */
    get defaultLocationId() {
      return garden.defaultLocationId;
    },
    get regionProfile() {
      return regions[garden.region];
    },
    get lastExportedAt() {
      return lastExportedAt;
    },
    get needsBackupWarning() {
      return shouldWarnAboutBackup(lastExportedAt);
    },

    /** Mag speciesId/locationId (nog) toegevoegd worden zonder een dubbele soort+standplaats te maken? */
    canAddPlanting(speciesId, locationId, excludeUid = null) {
      return findDuplicatePlantings(garden, speciesId, locationId, excludeUid).length === 0;
    },

    addPlanting({ speciesId, label = "", locationId = null, notes = "" }) {
      locationId ||= garden.defaultLocationId;
      if (!speciesIndex[speciesId]) {
        throw new Error(`Onbekende soort: "${speciesId}"`);
      }
      if (!this.canAddPlanting(speciesId, locationId)) {
        const species = speciesIndex[speciesId];
        const location = garden.locations?.find((l) => l.id === locationId);
        throw new Error(
          `Je hebt al een ${species.name} op "${location?.name ?? "deze standplaats"}" staan.`
        );
      }
      const uid = makePlantingUid();
      garden.plantings.push({
        uid,
        speciesId,
        label,
        locationId,
        notes,
        plantedOn: "",
        mutedTasks: [],
        extraTasks: [],
      });
      persist();
      return uid;
    },

    removePlanting(uid) {
      garden.plantings = garden.plantings.filter((p) => p.uid !== uid);
      persist();
    },

    updatePlanting(uid, patch) {
      const planting = garden.plantings.find((p) => p.uid === uid);
      if (!planting) return;
      Object.assign(planting, patch);
      persist();
    },

    addLocation({ name, kind = null, soil = "" }) {
      const trimmed = (name ?? "").trim();
      if (!trimmed) {
        throw new Error("Standplaats moet een naam hebben.");
      }
      const location = { id: makeLocationId(), name: trimmed };
      if (kind) location.kind = kind;
      if (soil) location.soil = soil;
      garden.locations = [...(garden.locations ?? []), location];
      persist();
      return location;
    },

    updateLocation(id, patch) {
      const location = garden.locations?.find((l) => l.id === id);
      if (!location) return;
      Object.assign(location, patch);
      persist();
    },

    setDefaultLocation(id) {
      if (!garden.locations?.some((l) => l.id === id)) return;
      garden.defaultLocationId = id;
      persist();
    },

    /** Plantingen op deze standplaats verhuizen naar de standaardstandplaats; die zelf is niet te verwijderen. */
    removeLocation(id) {
      if (id === garden.defaultLocationId) {
        throw new Error("Dit is de standaardstandplaats. Kies eerst een andere standaard.");
      }
      garden.plantings = reassignPlantings(garden.plantings, id, garden.defaultLocationId);
      garden.locations = (garden.locations ?? []).filter((l) => l.id !== id);
      persist();
    },

    toggleMutedTask(uid, taskId) {
      const planting = garden.plantings.find((p) => p.uid === uid);
      if (!planting) return;
      const muted = new Set(planting.mutedTasks ?? []);
      if (muted.has(taskId)) muted.delete(taskId);
      else muted.add(taskId);
      planting.mutedTasks = [...muted];
      persist();
    },

    exportAsJson() {
      return exportGardenAsJson(garden);
    },

    /** Aanroepen nadat een export daadwerkelijk is gelukt (download of deel-actie). */
    recordExport() {
      lastExportedAt = Date.now();
      setLastExportedAt(lastExportedAt);
    },

    importFromJson(jsonText) {
      garden = importGardenFromJson(jsonText);
      persist();
    },

    reset(regionId = garden.region) {
      garden = createEmptyGarden(regionId);
      persist();
    },
  };
}

export const gardenState = createGardenState();
