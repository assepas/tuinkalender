<script>
  // Doorzoekbare soortenkiezer: bij honderden soorten is een platte <select>
  // onbruikbaar. Standaard ARIA-combobox-patroon (tekstinput + listbox),
  // geen nieuwe dependency. Resultaten gegroepeerd per categorie, zodat de
  // lijst ook zonder te typen scanbaar blijft.
  import { CATEGORY_ORDER, CATEGORY_LABELS } from "../lib/domain/plantings.js";
  import { auth } from "../lib/state/auth.svelte.js";
  import { requestNewSpecies } from "../lib/state/ui.svelte.js";
  import Icon from "./Icon.svelte";
  import PlantIcon from "./PlantIcon.svelte";

  // onadvanced(zoekterm): toont een ingang naar Uitgebreid zoeken — in een
  // breed veld als knop rechts in het veld, in een smal veld (mobiel) als
  // vaste regel onder de lijst.
  // Die regel is bewust geen optie: hij telt niet mee in de pijltjesnavigatie.
  let { speciesList, value = $bindable(null), id = undefined, onadvanced = null } = $props();

  // Op de breedte van het veld zelf, niet van het scherm: de knop moet naast
  // de getypte tekst passen.
  let width = $state(0);
  const advancedInline = $derived(!!onadvanced && width >= 400);
  const advancedInList = $derived(!!onadvanced && !advancedInline);

  let query = $state("");
  let open = $state(false);
  let activeIndex = $state(-1);
  let inputEl = $state();
  let listEl = $state();

  const selectedSpecies = $derived(speciesList.find((s) => s.id === value) ?? null);

  // Zolang de lijst dicht is, toont het veld de naam van de huidige keuze —
  // zodra 'ie opengaat (zie openList) wordt dat weer een leeg zoekveld.
  $effect(() => {
    if (!open) query = selectedSpecies?.name ?? "";
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return speciesList;
    return speciesList.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.latin ?? "").toLowerCase().includes(q)
    );
  });

  const groups = $derived.by(() => {
    const byCategory = new Map();
    for (const s of filtered) {
      if (!byCategory.has(s.category)) byCategory.set(s.category, []);
      byCategory.get(s.category).push(s);
    }
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({
      category: c,
      label: CATEGORY_LABELS[c] ?? c,
      items: byCategory.get(c).sort((a, b) => a.name.localeCompare(b.name, "nl")),
    }));
  });

  // Platte lijst van alléén de selecteerbare opties (groepskoppen tellen
  // niet mee), in weergave-volgorde — voor pijltjestoetsnavigatie.
  const flatOptions = $derived(groups.flatMap((g) => g.items));
  const activeOption = $derived(activeIndex >= 0 ? flatOptions[activeIndex] : null);

  // Admins: onderaan "+ Nieuwe plant … toevoegen" zodra de getypte naam niet
  // precies een bestaande soort is. Telt in de pijltjesnavigatie mee als
  // laatste optie (index flatOptions.length).
  const newName = $derived(query.trim());
  const showAddOption = $derived(
    auth.isAdmin &&
      newName.length > 0 &&
      !speciesList.some((s) => s.name.toLowerCase() === newName.toLowerCase())
  );
  const addIndex = $derived(flatOptions.length);
  const optionCount = $derived(flatOptions.length + (showAddOption ? 1 : 0));
  const addActive = $derived(showAddOption && activeIndex === addIndex);

  function openList() {
    query = ""; // volledige lijst tonen; typen filtert vanaf hier
    open = true;
    activeIndex = 0;
  }

  function closeList() {
    open = false;
    activeIndex = -1;
  }

  function openAdvanced() {
    const typed = open ? query.trim() : "";
    closeList();
    inputEl?.blur();
    onadvanced(typed);
  }

  function select(species) {
    value = species.id;
    closeList();
    inputEl?.focus();
  }

  function handleInput(event) {
    query = event.target.value;
    open = true;
    activeIndex = 0;
  }

  function scrollActiveIntoView() {
    requestAnimationFrame(() => {
      listEl?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleKeydown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return openList();
      activeIndex = Math.min(activeIndex + 1, optionCount - 1);
      scrollActiveIntoView();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openList();
      activeIndex = Math.max(activeIndex - 1, 0);
      scrollActiveIntoView();
    } else if (event.key === "Enter") {
      if (open && addActive) {
        event.preventDefault();
        requestNewSpecies(newName);
      } else if (open && activeOption) {
        event.preventDefault();
        select(activeOption);
      }
    } else if (event.key === "Escape") {
      closeList();
    }
  }
</script>

<div class="combobox" class:has-advanced={advancedInline} bind:clientWidth={width}>
  <input
    bind:this={inputEl}
    {id}
    type="text"
    role="combobox"
    aria-expanded={open}
    aria-controls="species-listbox"
    aria-activedescendant={addActive
      ? "species-option-new"
      : activeOption
        ? `species-option-${activeOption.id}`
        : undefined}
    autocomplete="off"
    placeholder="Typ om een soort te zoeken…"
    value={query}
    oninput={handleInput}
    onfocus={openList}
    onkeydown={handleKeydown}
    onblur={closeList}
  />
  {#if advancedInline}
    <!-- mousedown tegenhouden: anders sluit de lijst (blur) en is de getypte tekst weg vóór de klik. -->
    <button
      type="button"
      class="combobox-advanced"
      onmousedown={(e) => e.preventDefault()}
      onclick={openAdvanced}
    >
      <Icon name="filter" size={16} /> Uitgebreid zoeken…
    </button>
  {/if}
  {#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="combobox-popup" onmousedown={(e) => e.preventDefault()}>
    <ul
      class="combobox-listbox"
      role="listbox"
      id="species-listbox"
      bind:this={listEl}
    >
      {#if flatOptions.length === 0}
        <li class="combobox-empty">Geen soorten gevonden.</li>
      {/if}
      {#each groups as group (group.category)}
        <li class="combobox-group-label" role="presentation">{group.label}</li>
        {#each group.items as species (species.id)}
          {@const index = flatOptions.indexOf(species)}
          <!-- Toetsenbordbediening loopt via het combobox-invoerveld (pijltjes/Enter),
               niet via deze optie zelf — vergelijkbaar met het bestaande patroon in DetailModal.svelte. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <li
            id={`species-option-${species.id}`}
            role="option"
            aria-selected={index === activeIndex}
            class="combobox-option"
            class:active={index === activeIndex}
            onclick={() => select(species)}
            onmouseenter={() => (activeIndex = index)}
          >
            <PlantIcon {species} size={22} />
            <span class="combobox-option-text">
              <span class="combobox-option-name">{species.name}</span>
              {#if species.latin}<span class="combobox-option-latin">{species.latin}</span>{/if}
            </span>
          </li>
        {/each}
      {/each}
      {#if showAddOption}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <li
          id="species-option-new"
          role="option"
          aria-selected={addActive}
          class="combobox-option combobox-add"
          class:active={addActive}
          onclick={() => requestNewSpecies(newName)}
          onmouseenter={() => (activeIndex = addIndex)}
        >
          + Nieuwe plant "{newName}" toevoegen
        </li>
      {/if}
    </ul>
    {#if advancedInList}
      <button type="button" class="combobox-advanced-row" onclick={openAdvanced}>
        <Icon name="filter" size={18} /> Uitgebreid zoeken…
      </button>
    {/if}
    </div>
  {/if}
</div>

<style>
  .combobox {
    position: relative;
  }

  .combobox.has-advanced input {
    padding-right: 11rem;
  }

  .combobox-advanced {
    position: absolute;
    top: 50%;
    right: var(--space-1);
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: calc(100% - 2 * var(--space-1));
    padding: 0 var(--space-3);
    background: var(--color-surface);
    border: var(--border);
    border-radius: var(--radius);
    font-size: var(--step-1);
    color: var(--color-primary);
    white-space: nowrap;
    cursor: pointer;
  }

  .combobox-advanced:hover {
    background: var(--color-plant-bg);
    border-color: var(--color-line-strong);
  }

  /* De lijst scrolt; de regel "Uitgebreid zoeken" eronder staat vast. */
  .combobox-popup {
    position: absolute;
    z-index: 30;
    top: calc(100% + var(--space-1));
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    max-height: 18rem;
    background: var(--color-surface-raised);
    border: var(--border);
    border-radius: var(--radius);
    box-shadow: 0 4px 16px rgba(35, 42, 30, 0.15);
    overflow: hidden;
  }

  .combobox-listbox {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: var(--space-1);
    list-style: none;
  }

  .combobox-advanced-row {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface);
    border: none;
    border-top: var(--border);
    font-size: var(--step0);
    color: var(--color-primary);
    text-align: left;
    cursor: pointer;
  }

  .combobox-empty {
    padding: var(--space-2) var(--space-3);
    color: var(--color-ink-muted);
    font-style: italic;
    font-size: var(--step-1);
  }

  .combobox-group-label {
    padding: var(--space-2) var(--space-2) var(--space-1);
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-ink-faint);
  }

  .combobox-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius);
    cursor: pointer;
  }

  .combobox-option.active {
    background: var(--color-plant-bg);
  }

  /* Zelfde taal als de "toevoegen"-optie in Select.svelte. */
  .combobox-add {
    color: var(--color-primary);
    padding: var(--space-2);
  }

  .combobox-add:not(:first-child) {
    margin-top: var(--space-1);
    border-top: var(--border);
  }

  .combobox-option-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .combobox-option-name {
    font-size: var(--step0);
    color: var(--color-ink);
  }

  .combobox-option-latin {
    font-style: italic;
    font-size: 0.75em;
    color: var(--color-ink-muted);
  }
</style>
