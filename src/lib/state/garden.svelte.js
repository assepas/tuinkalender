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
} from "../storage/garden.js";
import { speciesIndex, regions } from "../generated/data.js";

function createGardenState() {
  let garden = $state(loadGarden());

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
    get regionProfile() {
      return regions[garden.region];
    },

    addPlanting({ speciesId, label = "", position = "", soil = "", notes = "" }) {
      if (!speciesIndex[speciesId]) {
        throw new Error(`Onbekende soort: "${speciesId}"`);
      }
      garden.plantings.push({
        uid: makePlantingUid(),
        speciesId,
        label,
        position,
        soil,
        notes,
        plantedOn: "",
        mutedTasks: [],
        extraTasks: [],
      });
      persist();
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

    importFromJson(jsonText) {
      garden = importGardenFromJson(jsonText);
      persist();
    },

    reset(regionId = garden.region) {
      garden = { schemaVersion: garden.schemaVersion, region: regionId, plantings: [] };
      persist();
    },
  };
}

export const gardenState = createGardenState();
