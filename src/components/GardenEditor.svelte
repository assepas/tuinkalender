<script>
  import { speciesIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import {
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    toggleInSet,
    compareByKey,
    filterPlantingRows,
  } from "../lib/domain/plantings.js";
  import { ui, closeLocationManager } from "../lib/state/ui.svelte.js";
  import LocationManager from "./LocationManager.svelte";
  import Modal from "./Modal.svelte";
  import NewPlantingRow from "./NewPlantingRow.svelte";
  import PlantingRow from "./PlantingRow.svelte";

  let importText = $state("");
  let importError = $state("");
  let fileInput;

  // Sorteren/filteren van het overzicht — puur client-side, geen paginering
  // nodig bij de tientallen (niet honderden) plantingen die een tuin heeft.
  let sortKey = $state("naam"); // "naam" | "standplaats"
  let sortDir = $state("asc"); // "asc" | "desc"
  let filterLocationIds = $state(new Set());
  let filterCategories = $state(new Set());

  // In deze sessie toegevoegde plantingen (nieuwste eerst): die staan
  // bovenaan, los van sortering en filters, zodat je ze direct verder kunt
  // invullen. Niet opgeslagen — na een tabwissel staat alles weer gesorteerd.
  let addedUids = $state([]);

  const pinnedPlantings = $derived(
    addedUids.map((uid) => gardenState.plantings.find((p) => p.uid === uid)).filter(Boolean)
  );

  const locationIndex = $derived(Object.fromEntries(gardenState.locations.map((l) => [l.id, l])));

  const visiblePlantings = $derived.by(() => {
    const pinned = new Set(addedUids);
    const rows = gardenState.plantings.filter((p) => !pinned.has(p.uid)).map((planting) => ({
      planting,
      species: speciesIndex[planting.speciesId],
      location: locationIndex[planting.locationId],
    }));

    const filtered = filterPlantingRows(rows, filterLocationIds, filterCategories);

    // Ontbrekende waarden (verwijderde soort/standplaats) sorteren als lege
    // string mee naar het begin — geen crash, geen verrassende volgorde.
    const keyFor = (r) => {
      if (sortKey === "standplaats") return r.location?.name ?? "";
      return r.planting.label || r.species?.name || "";
    };
    return [...filtered].sort(compareByKey(keyFor, sortDir));
  });

  function toggleSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
  }

  // aria-sort hoort op een <th>, niet op een <button> — dus een gewone
  // aria-label die de huidige sorteerstand uitspreekt i.p.v. dat attribuut.
  function sortLabel(key, columnLabel) {
    if (sortKey !== key) return `Sorteer op ${columnLabel}`;
    const richting = sortDir === "asc" ? "oplopend" : "aflopend";
    return `Sorteer op ${columnLabel} (nu ${richting} — klik om om te draaien)`;
  }

  function exportFilename() {
    return `tuintaak-${new Date().toISOString().slice(0, 10)}.json`;
  }

  function downloadExport(json, filename) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    gardenState.recordExport();
  }

  // Op mobiel liever het native deelvenster (Bewaar in Bestanden, AirDrop,
  // appen naar iemand) dan alleen een download — val terug op de downloadlink
  // als de browser geen bestanden kan delen.
  async function shareOrDownloadExport() {
    const json = gardenState.exportAsJson();
    const filename = exportFilename();

    if (navigator.share && navigator.canShare) {
      const file = new File([json], filename, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "TuinTaak" });
          gardenState.recordExport();
          return;
        } catch (err) {
          if (err?.name === "AbortError") return; // gebruiker annuleerde het deelvenster
          console.error("[export] delen mislukt, val terug op download:", err);
        }
      }
    }

    downloadExport(json, filename);
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      importText = text;
      applyImport();
    });
  }

  function applyImport() {
    importError = "";
    try {
      gardenState.importFromJson(importText);
      importText = "";
    } catch (err) {
      importError = err.message;
    }
  }
</script>

<div class="panel">
  <h2>Planten in je tuin ({gardenState.plantings.length})</h2>
  {#if gardenState.plantings.length > 0}
    {#if gardenState.locations.length > 1}
      <div class="filter-bar">
        <span class="filter-bar-label">Standplaats</span>
        {#each gardenState.locations as location (location.id)}
          <button
            type="button"
            class="filter-chip"
            aria-pressed={filterLocationIds.has(location.id)}
            onclick={() => (filterLocationIds = toggleInSet(filterLocationIds, location.id))}
          >
            {location.name}
          </button>
        {/each}
      </div>
    {/if}
    <div class="filter-bar">
      <span class="filter-bar-label">Type</span>
      {#each CATEGORY_ORDER as category (category)}
        <button
          type="button"
          class="filter-chip"
          aria-pressed={filterCategories.has(category)}
          onclick={() => (filterCategories = toggleInSet(filterCategories, category))}
        >
          {CATEGORY_LABELS[category]}
        </button>
      {/each}
    </div>

    <div class="planting-table-head">
      <button
        type="button"
        class="sort-button sort-name"
        aria-label={sortLabel("naam", "Naam")}
        onclick={() => toggleSort("naam")}
      >
        Naam{#if sortKey === "naam"} {sortDir === "asc" ? "▲" : "▼"}{/if}
      </button>
      <button
        type="button"
        class="sort-button sort-location"
        aria-label={sortLabel("standplaats", "Standplaats")}
        onclick={() => toggleSort("standplaats")}
      >
        Standplaats{#if sortKey === "standplaats"} {sortDir === "asc" ? "▲" : "▼"}{/if}
      </button>
    </div>
  {/if}

  <!-- De '+'-rij staat er altijd, ook bij een lege tuin of als de filters alles verbergen. -->
  <ul class="planting-list">
    <NewPlantingRow onadded={(uid) => (addedUids = [uid, ...addedUids])} />
    {#each pinnedPlantings as planting (planting.uid)}
      <PlantingRow {planting} autoExpand={planting.uid === addedUids[0]} />
    {/each}
    {#each visiblePlantings as { planting } (planting.uid)}
      <PlantingRow {planting} />
    {/each}
  </ul>
  {#if gardenState.plantings.length === 0}
    <p class="empty-state">Nog geen planten toegevoegd.</p>
  {:else if visiblePlantings.length === 0 && pinnedPlantings.length === 0}
    <p class="empty-state">Geen planten gevonden met deze filters.</p>
  {/if}
</div>

{#if ui.locationManager.open}
  <Modal title="Standplaatsen" wide onclose={closeLocationManager}>
    <LocationManager
      idPrefix="modal"
      onadded={(location) => {
        ui.locationManager.onadded?.(location);
        closeLocationManager();
      }}
    />
  </Modal>
{/if}

<div class="panel">
  <h2>Back-up &amp; delen</h2>
  <p class="hint">
    Je tuin staat lokaal in deze browser. Exporteer regelmatig een back-up, en gebruik dezelfde
    export om je tuin op een ander apparaat te openen of met iemand anders te delen.
  </p>
  {#if gardenState.needsBackupWarning}
    <p class="error-text">
      {#if gardenState.lastExportedAt == null}
        Je hebt nog nooit een back-up geëxporteerd. Doe dat nu, dan ben je niet afhankelijk van
        de data die deze browser onthoudt.
      {:else}
        Je laatste back-up is van {new Date(gardenState.lastExportedAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} — tijd voor een nieuwe export.
      {/if}
    </p>
  {/if}
  <div class="btn-row">
    <button type="button" class="btn btn-primary" onclick={shareOrDownloadExport}>
      Tuin exporteren (.json)
    </button>
    <button type="button" class="btn" onclick={() => fileInput.click()}> Tuin importeren… </button>
    <input
      type="file"
      accept="application/json"
      bind:this={fileInput}
      onchange={handleFile}
      style="display:none"
    />
  </div>
  {#if importError}
    <p class="error-text">{importError}</p>
  {/if}
</div>