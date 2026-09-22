<script>
  // Doorzoekbare soortenkiezer: bij honderden soorten is een platte <select>
  // onbruikbaar. Standaard ARIA-combobox-patroon (tekstinput + listbox),
  // geen nieuwe dependency. Resultaten gegroepeerd per categorie, zodat de
  // lijst ook zonder te typen scanbaar blijft.
  import { CATEGORY_ORDER, CATEGORY_LABELS } from "../lib/domain/plantings.js";
  import PlantIcon from "./PlantIcon.svelte";

  let { speciesList, value = $bindable(null), id = undefined } = $props();

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

  function openList() {
    query = ""; // volledige lijst tonen; typen filtert vanaf hier
    open = true;
    activeIndex = 0;
  }

  function closeList() {
    open = false;
    activeIndex = -1;
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
      activeIndex = Math.min(activeIndex + 1, flatOptions.length - 1);
      scrollActiveIntoView();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openList();
      activeIndex = Math.max(activeIndex - 1, 0);
      scrollActiveIntoView();
    } else if (event.key === "Enter") {
      if (open && activeOption) {
        event.preventDefault();
        select(activeOption);
      }
    } else if (event.key === "Escape") {
      closeList();
    }
  }
</script>

<div class="combobox">
  <input
    bind:this={inputEl}
    {id}
    type="text"
    role="combobox"
    aria-expanded={open}
    aria-controls="species-listbox"
    aria-activedescendant={activeOption ? `species-option-${activeOption.id}` : undefined}
    autocomplete="off"
    placeholder="Typ om een soort te zoeken…"
    value={query}
    oninput={handleInput}
    onfocus={openList}
    onkeydown={handleKeydown}
    onblur={closeList}
  />
  {#if open}
    <ul
      class="combobox-listbox"
      role="listbox"
      id="species-listbox"
      bind:this={listEl}
      onmousedown={(e) => e.preventDefault()}
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
    </ul>
  {/if}
</div>

<style>
  .combobox {
    position: relative;
  }

  .combobox-listbox {
    position: absolute;
    z-index: 30;
    top: calc(100% + var(--space-1));
    left: 0;
    right: 0;
    max-height: 18rem;
    overflow-y: auto;
    margin: 0;
    padding: var(--space-1);
    list-style: none;
    background: var(--color-surface-raised);
    border: var(--border);
    border-radius: var(--radius);
    box-shadow: 0 4px 16px rgba(35, 42, 30, 0.15);
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
