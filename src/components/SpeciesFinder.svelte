<script>
  // Uitgebreid zoeken in de plantendatabase, om planten voor een plek uit te
  // kiezen. Geopend vanuit de soortenzoeker in de toevoegrij (NewPlantingRow).
  // Kies je een standplaats, dan staan licht/grond/vocht daarvan als filter
  // klaar en komen toegevoegde planten op die plek. De zoeklogica zelf staat
  // in speciesSearch.js.
  import { onMount, untrack } from "svelte";
  import { MONTH_NAMES, getBloomMonths } from "../lib/domain/calendar.js";
  import {
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    SUN_ORDER,
    SUN_LABELS,
    SOIL_ORDER,
    SOIL_LABELS,
    MOISTURE_ORDER,
    MOISTURE_LABELS,
    SUN_ICONS,
    SOIL_ICONS,
    MOISTURE_ICONS,
    formatEnumList,
    formatHeight,
    toggleInSet,
  } from "../lib/domain/plantings.js";
  import {
    COLOR_FAMILIES,
    NATIVE_ORDER,
    NATIVE_LABELS,
    NATIVE_HINTS,
    SIZE_CLASSES,
    emptyFilters,
    countActiveFilters,
    searchSpecies,
    tagOptions,
    filtersForLocation,
  } from "../lib/domain/speciesSearch.js";
  import { catalog } from "../lib/state/catalog.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { ui } from "../lib/state/ui.svelte.js";
  import ConditionLabel from "./ConditionLabel.svelte";
  import PlantIcon from "./PlantIcon.svelte";
  import Select from "./Select.svelte";

  let { initialQuery = "", initialLocationId = null, onadded = null } = $props();

  // De begin-props zijn bewust alleen een startwaarde.
  const start = untrack(() => ({ query: initialQuery, locationId: initialLocationId }));

  let filters = $state({ ...emptyFilters(), query: start.query });
  let locationId = $state("");
  let showAllTags = $state(false);
  let filtersExpanded = $state(false);
  let expandedId = $state(null);
  let addedIds = $state(new Set());
  let searchInput = $state();

  const MONTH_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const TOP_TAGS = 10;

  const locationOptions = $derived([
    { value: "", label: "— vrij zoeken —" },
    ...gardenState.locations.map((l) => ({ value: l.id, label: l.name })),
  ]);
  const targetLocationId = $derived(locationId || gardenState.defaultLocationId);
  const targetLocation = $derived(gardenState.locations.find((l) => l.id === targetLocationId));

  const results = $derived(searchSpecies(catalog.speciesList, filters));
  const allTags = $derived(tagOptions(catalog.speciesList));
  const visibleTags = $derived(
    showAllTags ? allTags : [...new Set([...allTags.slice(0, TOP_TAGS), ...filters.tags])]
  );
  const activeCount = $derived(countActiveFilters(filters));
  const inGarden = $derived(new Set(gardenState.plantings.map((p) => p.speciesId)));
  const showFilters = $derived(!ui.isMobile || filtersExpanded);

  function chooseLocation(id) {
    locationId = id;
    const location = gardenState.locations.find((l) => l.id === id);
    filters = { ...filters, ...filtersForLocation(location) };
  }

  if (start.locationId) chooseLocation(start.locationId);

  // Op mobiel niet meteen focussen: dan schuift het toetsenbord over de filters.
  onMount(() => {
    if (!ui.isMobile) searchInput?.focus();
  });

  function toggle(key, value) {
    filters = { ...filters, [key]: toggleInSet(filters[key], value) };
  }

  function clearFilters() {
    filters = { ...emptyFilters(), query: filters.query };
  }

  function add(species) {
    const uid = gardenState.addPlanting({ speciesId: species.id, locationId: targetLocationId });
    addedIds = new Set([...addedIds, species.id]);
    onadded?.(uid);
  }

  function bloomLabel(species) {
    const months = getBloomMonths(species);
    if (!months) return "";
    const first = MONTH_SHORT[months[0] - 1];
    const last = MONTH_SHORT[months[months.length - 1] - 1];
    return months.length === 1 ? `bloei ${first}` : `bloei ${first}–${last}`;
  }

  // Tekstdeel van de resultaatregel; licht en vocht staan ervoor als icoontjes.
  function summaryText(species) {
    const g = species.growing ?? {};
    return [
      g.soil?.length && formatEnumList(g.soil, SOIL_ORDER, SOIL_LABELS).toLowerCase(),
      g.height && formatHeight(g.height),
      bloomLabel(species),
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const tagLabel = (tag) => tag.replaceAll("-", " ");
  const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);
</script>

{#snippet chipGroup(label, key, order, labels, hints = {}, icons = null)}
  <div class="filter-bar" role="group" aria-label={label}>
    <span class="filter-bar-label">{label}</span>
    {#each order as value (value)}
      <button
        type="button"
        class="filter-chip"
        aria-pressed={filters[key].has(value)}
        title={hints[value]}
        onclick={() => toggle(key, value)}
      >
        {#if icons}
          <ConditionLabel {...icons[value]} label={labels[value]} size={16} />
        {:else}
          {labels[value]}
        {/if}
      </button>
    {/each}
  </div>
{/snippet}

<!-- Licht of vocht van een soort als rijtje icoontjes (naam in de tooltip). -->
{#snippet iconRow(values, order, labels, icons)}
  <span class="finder-icons">
    {#each order.filter((v) => values?.includes(v)) as value (value)}
      <ConditionLabel {...icons[value]} label={labels[value]} iconOnly size={16} />
    {/each}
  </span>
{/snippet}

<div class="finder">
  <div class="finder-top">
    <label class="finder-location">
      <span class="filter-bar-label">Voor standplaats</span>
      <Select
        aria-label="Voor standplaats"
        options={locationOptions}
        value={locationId}
        onchange={chooseLocation}
      />
    </label>
    <input
      bind:this={searchInput}
      class="finder-search"
      type="search"
      aria-label="Zoek op naam of kenmerk"
      placeholder="Zoek op naam of kenmerk…"
      bind:value={filters.query}
    />
  </div>

  {#if ui.isMobile}
    <h3 class="finder-filters-toggle">
      <button
        type="button"
        class="panel-toggle"
        aria-expanded={filtersExpanded}
        aria-controls="finder-filters"
        onclick={() => (filtersExpanded = !filtersExpanded)}
      >
        <span class="chevron">{filtersExpanded ? "▾" : "▸"}</span>
        Filters{#if activeCount > 0}&nbsp;({activeCount}){/if}
      </button>
    </h3>
  {/if}

  {#if showFilters}
    <div id="finder-filters" class="finder-filters">
      {@render chipGroup("Licht", "sun", SUN_ORDER, SUN_LABELS, {}, SUN_ICONS)}
      {@render chipGroup("Grond", "soil", SOIL_ORDER, SOIL_LABELS, {}, SOIL_ICONS)}
      {@render chipGroup("Vocht", "moisture", MOISTURE_ORDER, MOISTURE_LABELS, {}, MOISTURE_ICONS)}

      <div class="filter-bar" role="group" aria-label="Bloeikleur">
        <span class="filter-bar-label">Bloeikleur</span>
        {#each COLOR_FAMILIES as family (family.id)}
          <button
            type="button"
            class="filter-chip"
            aria-pressed={filters.colors.has(family.id)}
            onclick={() => toggle("colors", family.id)}
          >
            <span class="finder-swatch" style:background={family.swatch}></span>
            {family.label}
          </button>
        {/each}
      </div>

      <div class="filter-bar" role="group" aria-label="Bloeimaand">
        <span class="filter-bar-label">Bloeit in</span>
        {#each MONTH_SHORT as month, i (month)}
          <button
            type="button"
            class="filter-chip finder-month"
            aria-pressed={filters.months.has(i + 1)}
            aria-label={MONTH_NAMES[i]}
            onclick={() => toggle("months", i + 1)}
          >
            {month}
          </button>
        {/each}
      </div>

      {@render chipGroup("Type", "categories", CATEGORY_ORDER, CATEGORY_LABELS)}

      <div class="filter-bar" role="group" aria-label="Grootte">
        <span class="filter-bar-label">Grootte</span>
        {#each SIZE_CLASSES as size (size.id)}
          <button
            type="button"
            class="filter-chip"
            aria-pressed={filters.size.has(size.id)}
            onclick={() => toggle("size", size.id)}
          >
            {size.label}&nbsp;<span class="finder-chip-hint">{size.hint}</span>
          </button>
        {/each}
      </div>
      {@render chipGroup("Herkomst", "native", NATIVE_ORDER, NATIVE_LABELS, NATIVE_HINTS)}

      <div class="filter-bar" role="group" aria-label="Kenmerken">
        <span class="filter-bar-label">Kenmerken</span>
        {#each visibleTags as tag (tag)}
          <button
            type="button"
            class="filter-chip"
            aria-pressed={filters.tags.has(tag)}
            onclick={() => toggle("tags", tag)}
          >
            {tagLabel(tag)}
          </button>
        {/each}
        {#if allTags.length > TOP_TAGS}
          <button type="button" class="filter-clear" onclick={() => (showAllTags = !showAllTags)}>
            {showAllTags ? "minder" : "meer…"}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <div class="finder-count">
    <span>
      {results.length === 1 ? "1 plant" : `${results.length} planten`}
      {#if targetLocation}<span class="finder-target">· toevoegen aan "{targetLocation.name}"</span>{/if}
    </span>
    {#if activeCount > 0}
      <button type="button" class="filter-clear" onclick={clearFilters}>Filters wissen ✕</button>
    {/if}
  </div>

  {#if results.length === 0}
    <p class="empty-state">Geen planten gevonden. Probeer minder filters.</p>
  {:else}
    <ul class="finder-results">
      {#each results as species (species.id)}
        {@const canAdd = gardenState.canAddPlanting(species.id, targetLocationId)}
        {@const expanded = expandedId === species.id}
        <li class="finder-row">
          <div class="finder-row-main">
            <PlantIcon {species} size={32} />
            <button
              type="button"
              class="finder-name"
              aria-expanded={expanded}
              onclick={() => (expandedId = expanded ? null : species.id)}
            >
              <span class="finder-name-text">{species.name}</span>
              {#if species.latin}<span class="finder-latin">{species.latin}</span>{/if}
              <span class="finder-summary">
                {#if species.growing?.sun?.length}{@render iconRow(species.growing.sun, SUN_ORDER, SUN_LABELS, SUN_ICONS)}{/if}
                {#if species.growing?.moisture?.length}{@render iconRow(species.growing.moisture, MOISTURE_ORDER, MOISTURE_LABELS, MOISTURE_ICONS)}{/if}
                <span>{summaryText(species)}</span>
              </span>
            </button>
            <div class="finder-actions">
              {#if inGarden.has(species.id) && !addedIds.has(species.id)}
                <span class="finder-badge">✓ in je tuin</span>
              {/if}
              {#if canAdd}
                <button type="button" class="btn btn-primary" onclick={() => add(species)}>Toevoegen</button>
              {:else}
                <span class="finder-added">{addedIds.has(species.id) ? "✓ toegevoegd" : "·   staat al op de gekozen standplaats"}</span>
              {/if}
            </div>
          </div>
          {#if expanded}
            <div class="finder-info">
              {#if species.info?.intro}<p>{species.info.intro}</p>{/if}
              <dl class="finder-traits">
                {#if species.nativeStatus}
                  <div>
                    <dt>Herkomst</dt>
                    <dd>{NATIVE_LABELS[species.nativeStatus]} — {lowerFirst(NATIVE_HINTS[species.nativeStatus])}</dd>
                  </div>
                {/if}
                {#if species.growing?.moisture?.length}
                  <div>
                    <dt>Vocht</dt>
                    <dd class="finder-conditions">
                      {#each MOISTURE_ORDER.filter((v) => species.growing.moisture.includes(v)) as value (value)}
                        <ConditionLabel {...MOISTURE_ICONS[value]} label={MOISTURE_LABELS[value]} size={16} />
                      {/each}
                    </dd>
                  </div>
                {/if}
                {#if species.growing?.spacingCm}
                  <div><dt>Plantafstand</dt><dd>{species.growing.spacingCm} cm</dd></div>
                {/if}
                {#if species.appearance?.flowerColorName}
                  <div><dt>Bloemkleur</dt><dd>{species.appearance.flowerColorName}</dd></div>
                {/if}
                {#if species.tags?.length}
                  <div><dt>Kenmerken</dt><dd>{species.tags.map(tagLabel).join(", ")}</dd></div>
                {/if}
              </dl>
              {#if species.info?.water}<p><strong>Water:</strong> {species.info.water}</p>{/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .finder-top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    align-items: center;
    margin-bottom: var(--space-4);
  }

  .finder-location {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 0 1 18rem;
  }

  .finder-location :global(.select) {
    flex: 1;
  }

  .finder-search {
    flex: 1 1 16rem;
    min-width: 0;
  }

  .finder-filters-toggle {
    margin: 0 0 var(--space-3);
    font-size: var(--step0);
    font-weight: 500;
  }

  .finder-swatch {
    display: inline-block;
    width: 0.7rem;
    height: 0.7rem;
    margin-right: var(--space-1);
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.15);
  }

  .finder-chip-hint {
    opacity: 0.7;
  }

  .finder-month {
    min-width: 2.6rem;
    justify-content: center;
  }

  .finder-count {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) 0;
    border-top: var(--border);
    font-size: var(--step-1);
    color: var(--color-ink-muted);
  }

  .finder-target {
    color: var(--color-ink-faint);
  }

  .finder-results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .finder-row {
    border: var(--border);
    border-radius: var(--radius);
    background: var(--color-surface);
    padding: var(--space-2) var(--space-3);
  }

  .finder-row-main {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .finder-name {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    background: none;
    border: none;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .finder-name:hover .finder-name-text {
    color: var(--color-primary);
  }

  .finder-latin {
    font-style: italic;
    font-size: 0.8em;
    color: var(--color-ink-muted);
  }

  .finder-summary {
    font-size: var(--step-1);
    color: var(--color-ink-faint);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
  }

  .finder-icons {
    display: inline-flex;
    gap: 2px;
  }

  .finder-conditions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
  }


  .finder-actions {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .finder-badge,
  .finder-added {
    font-size: var(--step-1);
    color: var(--color-ink-muted);
    white-space: nowrap;
  }

  .finder-info {
    margin: var(--space-2) 0 var(--space-1) calc(32px + var(--space-3));
    font-size: var(--step-1);
    color: var(--color-ink-muted);
  }

  .finder-info p {
    margin: 0 0 var(--space-2);
  }

  .finder-traits {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-3);
    margin: 0 0 var(--space-2);
  }

  .finder-traits div {
    display: contents;
  }

  .finder-traits dt {
    color: var(--color-ink-faint);
  }

  .finder-traits dd {
    margin: 0;
  }

  @media (max-width: 34rem) {
    .finder-row-main {
      flex-wrap: wrap;
    }

    .finder-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .finder-info {
      margin-left: 0;
    }
  }
</style>
