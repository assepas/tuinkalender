// Reactieve wrapper rond het tuindocument met Svelte 5 runes.
// Componenten importeren `gardenState` en lezen/schrijven daarop; alleen
// persist() hieronder slaat op, dus opslaan blijft op één plek geregeld.
//
// Twee standen:
// - "local": niet ingelogd (of nog geen tuin in je account). De tuin staat
//   alleen in deze browser, precies zoals vroeger.
// - "cloud": ingelogd met een gekozen tuin in Supabase. Elke wijziging gaat
//   eerst naar een offline-kopie en daarna (gebundeld) naar de server, met
//   een versiecheck. Was iemand anders eerder, dan halen we de nieuwste
//   versie op en voegen we samen (domain/merge.js) — er gaat niets verloren,
//   ook niet na offline werken. Via Realtime zie je wijzigingen van
//   mede-tuiniers direct.

import {
  loadGarden,
  saveGarden,
  clearLocalGarden,
  exportGardenAsJson,
  importGardenFromJson,
  makePlantingUid,
  makeLocationId,
  getLastExportedAt,
  setLastExportedAt,
  loadCloudCache,
  saveCloudCache,
  clearCloudCache,
  DEFAULT_REGION,
} from "../storage/garden.js";
import {
  listGardens,
  fetchGarden,
  createGarden,
  pushGarden,
  renameGarden,
  deleteGarden,
  removeMember,
  acceptInvite,
  subscribeToGarden,
} from "../storage/cloudGarden.js";
import { shouldWarnAboutBackup } from "../domain/backup.js";
import { createEmptyGarden, migrateGarden } from "../domain/migrate.js";
import { mergeGardens } from "../domain/merge.js";
import { findDuplicatePlantings, reassignPlantings } from "../domain/plantings.js";
import { catalog } from "./catalog.svelte.js";
import { auth } from "./auth.svelte.js";

const PUSH_DELAY_MS = 400; // snelle reeks wijzigingen (typen) bundelen tot één save
const RETRY_INTERVAL_MS = 30_000;
const MAX_PUSH_ATTEMPTS = 5;

/** Fouten zonder PostgREST-code zijn netwerkfouten (offline, time-out). */
function isNetworkError(err) {
  return !err?.code || err?.name === "TypeError" || navigator.onLine === false;
}

function createGardenState() {
  const initialGarden = loadGarden();
  let garden = $state(initialGarden);
  let lastExportedAt = $state(getLastExportedAt());
  let localHasPlantings = $state(initialGarden.plantings.length > 0);

  // --- cloudstand ---
  let mode = $state("local"); // "local" | "cloud"
  let gardens = $state([]); // [{ id, name, role }] — tuinen in je account
  let cloud = $state(null); // { id, name, role } van de actieve cloudtuin
  let syncStatus = $state("idle"); // "idle" | "saving" | "offline" | "error"
  let syncError = $state("");
  let loadingCloud = $state(false);
  let notice = $state(""); // eenmalige melding, bv. over een uitnodiging

  // Niet-reactieve boekhouding voor het synchroniseren.
  let userId = null;
  let base = null; // laatst bekende serverversie van de tuin
  let version = 0; // serverversie waar `base` bij hoort
  let dirty = false; // lokale wijzigingen die nog niet op de server staan
  let editSeq = 0; // telt wijzigingen, om "tijdens het opslaan gewijzigd" te herkennen
  let pushing = false;
  let pushTimer = null;
  let unsubscribe = null;
  let sessionSeq = 0; // voorkomt dat een trage oude setUser() een nieuwere overschrijft

  function snapshot() {
    return $state.snapshot(garden);
  }

  function writeCache() {
    if (mode !== "cloud" || !cloud) return;
    saveCloudCache({
      userId,
      gardenId: cloud.id,
      name: cloud.name,
      role: cloud.role,
      version,
      base,
      garden: snapshot(),
      dirty,
    });
  }

  function persist() {
    if (mode === "local") {
      saveGarden(garden);
      localHasPlantings = garden.plantings.length > 0;
      return;
    }
    dirty = true;
    editSeq++;
    writeCache();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, PUSH_DELAY_MS);
  }

  /** Neemt een serverversie over; met lokale wijzigingen wordt er samengevoegd. */
  function applyRemote(row) {
    const remote = migrateGarden(structuredClone(row.data));
    garden = dirty ? mergeGardens(base, snapshot(), remote) : remote;
    base = structuredClone(remote);
    version = row.version;
    if (row.name && cloud && row.name !== cloud.name) {
      cloud.name = row.name;
      gardens = gardens.map((g) => (g.id === cloud.id ? { ...g, name: row.name } : g));
    }
    writeCache();
  }

  function handleSyncError(err) {
    if (err?.code === "PGRST116") {
      // Tuin bestaat niet meer, of je bent geen lid meer.
      lostGarden();
      return;
    }
    syncStatus = isNetworkError(err) ? "offline" : "error";
    syncError = err?.message ?? String(err);
    console.warn("[garden] synchroniseren mislukt:", err);
  }

  async function push() {
    if (mode !== "cloud" || !dirty || pushing) return;
    pushing = true;
    syncStatus = "saving";
    const gid = cloud.id;
    try {
      for (let attempt = 0; attempt < MAX_PUSH_ATTEMPTS; attempt++) {
        const seq = editSeq;
        const data = snapshot();
        const result = await pushGarden(gid, data, version);
        if (cloud?.id !== gid) return; // intussen van tuin gewisseld

        if (result.ok) {
          version = result.version;
          base = data;
          if (editSeq === seq) dirty = false;
          writeCache();
          if (!dirty) {
            syncStatus = "idle";
            syncError = "";
            return;
          }
          continue; // tijdens het opslaan is er weer iets gewijzigd
        }

        // Iemand anders was eerder: nieuwste versie ophalen, samenvoegen, opnieuw.
        const latest = await fetchGarden(gid);
        if (cloud?.id !== gid) return;
        applyRemote(latest);
      }
      syncStatus = "error";
      syncError = "Opslaan lukte niet na meerdere pogingen — probeer het zo nog eens.";
    } catch (err) {
      handleSyncError(err);
    } finally {
      pushing = false;
    }
  }

  function onRemoteUpdate(row) {
    // Tijdens het opslaan negeren: dat is onze eigen echo, of de push merkt
    // het conflict zelf en voegt dan samen.
    if (pushing || row.version <= version) return;
    applyRemote(row);
    if (dirty) push();
  }

  /** Haalt de serverversie op (na opstarten, terugkomen in de app of weer online). */
  async function refreshFromServer() {
    if (mode !== "cloud" || !cloud || pushing) return;
    const gid = cloud.id;
    try {
      const row = await fetchGarden(gid);
      if (cloud?.id !== gid) return;
      if (row.version > version) applyRemote(row);
      if (dirty) await push();
      else if (syncStatus === "offline") syncStatus = "idle";
    } catch (err) {
      handleSyncError(err);
    }
  }

  function stopCloud() {
    clearTimeout(pushTimer);
    unsubscribe?.();
    unsubscribe = null;
  }

  function enterCloud(meta, { data, version: v, dirty: d = false, base: b = null }) {
    stopCloud();
    mode = "cloud";
    cloud = { id: meta.id, name: meta.name, role: meta.role };
    garden = migrateGarden(structuredClone(data));
    base = structuredClone(b ?? data);
    version = v;
    dirty = d;
    syncStatus = d ? "offline" : "idle";
    syncError = "";
    writeCache();
    unsubscribe = subscribeToGarden(meta.id, onRemoteUpdate);
  }

  function enterLocal() {
    stopCloud();
    mode = "local";
    cloud = null;
    base = null;
    version = 0;
    dirty = false;
    syncStatus = "idle";
    syncError = "";
    garden = loadGarden();
  }

  async function openGarden(id) {
    const row = await fetchGarden(id);
    const role = gardens.find((g) => g.id === id)?.role ?? "editor";
    enterCloud({ id, name: row.name, role }, { data: row.data, version: row.version });
  }

  /** De actieve tuin is weg (verwijderd, of je bent verwijderd als lid). */
  async function lostGarden() {
    const lostId = cloud?.id;
    clearCloudCache();
    gardens = gardens.filter((g) => g.id !== lostId);
    notice = "Deze tuin bestaat niet meer, of je bent geen lid meer.";
    if (gardens[0]) {
      try {
        await openGarden(gardens[0].id);
        return;
      } catch (err) {
        handleSyncError(err);
      }
    }
    enterLocal();
  }

  async function setUser(user) {
    const seq = ++sessionSeq;
    stopCloud();
    userId = user?.id ?? null;
    gardens = [];

    if (!user) {
      if (mode === "cloud") clearCloudCache();
      enterLocal();
      return;
    }

    // Direct verder waar je was (werkt ook offline); daarna bijwerken.
    const cache = loadCloudCache();
    if (cache?.userId === user.id) {
      enterCloud(
        { id: cache.gardenId, name: cache.name, role: cache.role },
        { data: cache.garden, version: cache.version, dirty: cache.dirty, base: cache.base }
      );
    }

    loadingCloud = true;
    try {
      let inviteGardenId = null;
      const invite = auth.pendingInvite;
      if (invite) {
        try {
          inviteGardenId = await acceptInvite(invite);
          notice = "Je bent toegevoegd aan de gedeelde tuin.";
        } catch (err) {
          notice = err.message;
        } finally {
          auth.clearPendingInvite();
        }
      }
      if (seq !== sessionSeq) return;

      gardens = await listGardens(user.id);
      if (seq !== sessionSeq) return;

      const current = cloud && gardens.some((g) => g.id === cloud.id) ? cloud.id : null;
      const target = inviteGardenId ?? current ?? gardens[0]?.id;
      if (!target) {
        // Nog geen tuin in je account: lokaal blijven; "Mijn tuin" biedt uploaden aan.
        if (mode === "cloud") {
          clearCloudCache();
          enterLocal();
        }
        return;
      }
      if (target === cloud?.id) {
        cloud.role = gardens.find((g) => g.id === target).role;
        await refreshFromServer();
      } else {
        await openGarden(target);
      }
    } catch (err) {
      handleSyncError(err);
    } finally {
      if (seq === sessionSeq) loadingCloud = false;
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => refreshFromServer());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshFromServer();
    });
    setInterval(() => {
      if (dirty && !pushing) push();
    }, RETRY_INTERVAL_MS);
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
      return catalog.regions[garden.region];
    },
    get lastExportedAt() {
      return lastExportedAt;
    },
    get needsBackupWarning() {
      return mode === "local" && shouldWarnAboutBackup(lastExportedAt);
    },

    // --- account/cloud ---
    /** "local" of "cloud" — zie de uitleg bovenaan dit bestand. */
    get mode() {
      return mode;
    },
    /** De actieve cloudtuin ({ id, name, role }) of null. */
    get cloudGarden() {
      return cloud;
    },
    /** Alle tuinen in je account. */
    get gardens() {
      return gardens;
    },
    get syncStatus() {
      return syncStatus;
    },
    get syncError() {
      return syncError;
    },
    get loadingCloud() {
      return loadingCloud;
    },
    get notice() {
      return notice;
    },
    dismissNotice() {
      notice = "";
    },
    /** Staat er nog iets alleen op dit apparaat? (Waarschuwen vóór uitloggen.) */
    get hasUnsyncedChanges() {
      return mode === "cloud" && (dirty || syncStatus !== "idle");
    },
    /** De lokale tuin (van vóór het inloggen) heeft planten — dan uploaden aanbieden. */
    get localGardenHasPlantings() {
      return localHasPlantings;
    },

    /** Aangeroepen door main.js bij elke wissel van ingelogde gebruiker. */
    setUser,

    async selectGarden(id) {
      if (id === cloud?.id) return;
      if (dirty) await push();
      await openGarden(id);
    },

    /**
     * Nieuwe tuin in je account: leeg, of de lokale tuin uit deze browser.
     * Die lokale kopie wordt daarna gewist — hij staat dan in je account, en
     * zo kan hij niet per ongeluk twee keer geüpload worden.
     */
    async createCloudGarden(name, { fromLocal = false } = {}) {
      const data = fromLocal ? loadGarden() : createEmptyGarden(DEFAULT_REGION);
      const id = await createGarden(name, data);
      if (fromLocal) {
        clearLocalGarden();
        localHasPlantings = false;
      }
      gardens = await listGardens(userId);
      await openGarden(id);
    },

    async renameCloudGarden(name) {
      const trimmed = (name ?? "").trim();
      if (!cloud || !trimmed) return;
      await renameGarden(cloud.id, trimmed);
      cloud.name = trimmed;
      gardens = gardens.map((g) => (g.id === cloud.id ? { ...g, name: trimmed } : g));
      writeCache();
    },

    /** Alleen eigenaar: tuin voor iedereen verwijderen. */
    async deleteCloudGarden() {
      if (!cloud) return;
      const id = cloud.id;
      await deleteGarden(id);
      stopCloud();
      clearCloudCache();
      gardens = gardens.filter((g) => g.id !== id);
      if (gardens[0]) await openGarden(gardens[0].id);
      else enterLocal();
    },

    /** Als lid (niet-eigenaar) uit een gedeelde tuin stappen. */
    async leaveCloudGarden() {
      if (!cloud) return;
      const id = cloud.id;
      await removeMember(id, userId);
      stopCloud();
      clearCloudCache();
      gardens = gardens.filter((g) => g.id !== id);
      if (gardens[0]) await openGarden(gardens[0].id);
      else enterLocal();
    },

    /** Handmatig opnieuw proberen (knop bij een synchronisatiefout). */
    retrySync() {
      return dirty ? push() : refreshFromServer();
    },

    /** Mag speciesId/locationId (nog) toegevoegd worden zonder een dubbele soort+standplaats te maken? */
    canAddPlanting(speciesId, locationId, excludeUid = null) {
      return findDuplicatePlantings(garden, speciesId, locationId, excludeUid).length === 0;
    },

    addPlanting({ speciesId, label = "", locationId = null, notes = "" }) {
      locationId ||= garden.defaultLocationId;
      if (!catalog.speciesIndex[speciesId]) {
        throw new Error(`Onbekende soort: "${speciesId}"`);
      }
      if (!this.canAddPlanting(speciesId, locationId)) {
        const species = catalog.speciesIndex[speciesId];
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
