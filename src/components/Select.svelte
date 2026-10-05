<script>
  // Eigen keuzelijst i.p.v. de native <select>, die per browser/OS een eigen
  // (niet passende) lijst toont. Zelfde taal als SpeciesCombobox.svelte:
  // veld + zwevende lijst, actieve rij in plant-bg, vinkje bij de keuze.
  // Standaard ARIA-patroon "select-only combobox": de knop houdt de focus,
  // pijltjes/Enter/Spatie/Escape lopen via de knop.
  //
  // options: [{ value, label, disabled? }]. Waarden worden met === vergeleken
  // en ongewijzigd teruggegeven (dus ook getallen of null).
  // Gebruik óf met bind:value, óf "controlled" met value + onchange(gekozen
  // waarde): met onchange past de aanroeper de waarde zelf aan (of niet, bv.
  // na een bevestiging), net als bij LocationSelect.
  // Een optie met value "__add__" krijgt de "toevoegen"-stijl (lijntje erboven).
  let {
    options,
    value = $bindable(),
    onchange,
    id = undefined,
    disabled = false,
    placeholder = "Kies…",
    class: className = "",
    "aria-label": ariaLabel = undefined,
  } = $props();

  const uid = Math.random().toString(36).slice(2, 8);
  const listboxId = `select-listbox-${uid}`;

  let open = $state(false);
  let activeIndex = $state(-1);
  let listEl = $state();

  const selectedIndex = $derived(options.findIndex((o) => o.value === value));
  const selected = $derived(options[selectedIndex] ?? null);

  function firstEnabledFrom(start, step) {
    for (let i = start; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) return i;
    }
    return -1;
  }

  function openList() {
    if (disabled) return;
    activeIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledFrom(0, 1);
    open = true;
    scrollActiveIntoView();
  }

  function closeList() {
    open = false;
    activeIndex = -1;
  }

  function pick(option) {
    if (!option || option.disabled) return;
    closeList();
    if (option.value === value) return;
    if (onchange) onchange(option.value);
    else value = option.value;
  }

  function move(step) {
    const next = firstEnabledFrom(activeIndex + step, step);
    if (next >= 0) activeIndex = next;
    scrollActiveIntoView();
  }

  function scrollActiveIntoView() {
    requestAnimationFrame(() => {
      listEl?.querySelector(".select-option.active")?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleKeydown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openList();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" || event.key === " ") {
      if (open) {
        event.preventDefault();
        pick(options[activeIndex]);
      }
    } else if (event.key === "Escape") {
      if (open) event.stopPropagation(); // niet meteen ook een omringende modal sluiten
      closeList();
    }
  }
</script>

<div class="select {className}">
  <button
    {id}
    type="button"
    class="select-button"
    class:open
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listboxId}
    aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
    aria-label={ariaLabel}
    {disabled}
    onclick={() => (open ? closeList() : openList())}
    onkeydown={handleKeydown}
    onblur={closeList}
  >
    <span class="select-value" class:placeholder={!selected}>{selected ? selected.label : placeholder}</span>
    <svg class="select-chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6l4 4 4-4" />
    </svg>
  </button>
  {#if open}
    <!-- Bediening met het toetsenbord loopt via de knop (zie handleKeydown);
         mousedown voorkomen houdt de focus op de knop, zodat blur niet sluit. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <ul
      class="select-listbox"
      role="listbox"
      id={listboxId}
      bind:this={listEl}
      onmousedown={(e) => e.preventDefault()}
    >
      {#each options as option, i (option.value)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          id={`${listboxId}-${i}`}
          role="option"
          aria-selected={i === selectedIndex}
          aria-disabled={option.disabled || undefined}
          class="select-option"
          class:active={i === activeIndex && !option.disabled}
          class:disabled={option.disabled}
          class:add={option.value === "__add__"}
          onclick={() => pick(option)}
          onmouseenter={() => !option.disabled && (activeIndex = i)}
        >
          <span class="select-check">
            {#if i === selectedIndex}
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
            {/if}
          </span>
          <span class="select-option-label">{option.label}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .select {
    position: relative;
    min-width: 0;
  }

  /* Zelfde veldstijl als input/select in app.css. */
  .select-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    width: 100%;
    font-family: inherit;
    font-size: var(--step0);
    line-height: var(--line-height-body);
    text-align: left;
    padding: var(--space-2) var(--space-3);
    border: var(--border);
    border-radius: var(--radius);
    background: var(--color-surface-raised);
    color: var(--color-ink);
    cursor: pointer;
  }

  .select-button:hover:not(:disabled) {
    border-color: var(--color-line-strong);
  }

  .select-button.open {
    border-color: var(--color-primary);
  }

  .select-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .select-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-value.placeholder {
    color: var(--color-ink-faint);
  }

  .select-chevron {
    flex: none;
    width: 0.9em;
    height: 0.9em;
    fill: none;
    stroke: #7a8a6e;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 120ms;
  }

  .select-button.open .select-chevron {
    transform: rotate(180deg);
  }

  .select-listbox {
    position: absolute;
    z-index: 30;
    top: calc(100% + var(--space-1));
    left: 0;
    width: max-content; /* zo breed als de langste optie, binnen max-width */
    min-width: 100%;
    max-width: min(22rem, calc(100vw - 2rem));
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

  .select-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius);
    font-size: var(--step0);
    line-height: 1.3;
    color: var(--color-ink);
    cursor: pointer;
  }

  .select-option.active {
    background: var(--color-plant-bg);
  }

  .select-option.disabled {
    color: var(--color-ink-faint);
    cursor: default;
  }

  .select-option.add {
    color: var(--color-primary);
  }

  .select-option.add:not(:first-child) {
    margin-top: var(--space-1);
    border-top: var(--border);
  }

  .select-option[aria-selected="true"] .select-option-label {
    font-weight: 500;
  }

  .select-check {
    flex: none;
    display: inline-flex;
    width: 0.9em;
    color: var(--color-primary);
  }

  .select-check svg {
    width: 0.9em;
    height: 0.9em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .select-option-label {
    min-width: 0;
  }
</style>
