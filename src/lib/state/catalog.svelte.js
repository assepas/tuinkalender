// Reactieve plantencatalogus: soorten, taaktypes en regio's.
//
// Start direct met wat er is (cache van het vorige bezoek, anders de
// meegebakken data uit generated/data.js) en haalt daarna de actuele versie
// uit Supabase. Zo opent de app meteen, ook offline en zonder backend, en
// zijn wijzigingen van een admin na één keer laden overal zichtbaar.

import { speciesList, taskTypes, regions } from "../generated/data.js";
import { supabase } from "../supabase.js";
import { buildCatalog, catalogPartsFromRows, isValidCatalogParts } from "../domain/catalog.js";

const CACHE_KEY = "tuintaak:catalog:v1";

const bundledParts = { species: speciesList, taskTypes, regions: Object.values(regions) };

function readCache() {
  try {
    const parts = JSON.parse(localStorage.getItem(CACHE_KEY));
    return isValidCatalogParts(parts) ? parts : null;
  } catch {
    return null;
  }
}

function writeCache(parts) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(parts));
  } catch (err) {
    console.warn("[catalog] kon cache niet opslaan:", err);
  }
}

function createCatalog() {
  let current = $state.raw(buildCatalog(readCache() ?? bundledParts));
  let source = $state(readCache() ? "cache" : "bundled"); // "bundled" | "cache" | "remote"

  async function fetchRemoteParts() {
    const [species, taskTypesRes, regionsRes] = await Promise.all([
      supabase.from("species").select("id, data"),
      supabase.from("task_types").select("id, sort, data"),
      supabase.from("regions").select("id, data"),
    ]);
    const error = species.error ?? taskTypesRes.error ?? regionsRes.error;
    if (error) throw error;
    return catalogPartsFromRows({
      species: species.data,
      taskTypes: taskTypesRes.data,
      regions: regionsRes.data,
    });
  }

  return {
    get speciesList() {
      return current.speciesList;
    },
    get speciesIndex() {
      return current.speciesIndex;
    },
    get taskTypes() {
      return current.taskTypes;
    },
    get taskTypeIndex() {
      return current.taskTypeIndex;
    },
    get regions() {
      return current.regions;
    },
    /** Waar de huidige data vandaan komt — handig voor debuggen/beheer. */
    get source() {
      return source;
    },

    /** Haalt de actuele catalogus op. Faalt stil (offline/geen backend): de huidige data blijft staan. */
    async refresh() {
      if (!supabase) return;
      try {
        const parts = await fetchRemoteParts();
        if (!parts) return;
        current = buildCatalog(parts);
        source = "remote";
        writeCache(parts);
      } catch (err) {
        console.warn("[catalog] kon catalogus niet ophalen, gebruik lokale versie:", err);
      }
    },
  };
}

export const catalog = createCatalog();
