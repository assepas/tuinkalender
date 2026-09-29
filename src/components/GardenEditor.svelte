<script>
  import { catalog } from "../lib/state/catalog.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import {
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    toggleInSet,
    compareByKey,
    filterPlantingRows,
  } from "../lib/domain/plantings.js";
  import { ui, closeLocationManager } from "../lib/state/ui.svelte.js";
  import CloudGardenPanel from "./CloudGardenPanel.svelte";
  import Icon from "./Icon.svelte";
  import LocationManager from "./LocationManager.svelte";
  import Modal from "./Modal.svelte";
  import NewPlantingRow from "./NewPlantingRow.svelte";
  import PlantingRow from "./PlantingRow.svelte";

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
      species: catalog.speciesIndex[planting.speciesId],
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
</script>

<CloudGardenPanel />

<div class="panel">
  <div class="panel-head">
    <h2>Planten in je tuin ({gardenState.plantings.length})</h2>
    <button
      type="button"
      class="settings-button"
      aria-label="Instellingen"
      title="Instellingen"
      onclick={() => (ui.gardenSettingsOpen = true)}
    >
      <Icon name="flower" size={20} />
    </button>
  </div>
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
