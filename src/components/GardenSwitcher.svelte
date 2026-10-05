<script>
  // Tuinkiezer in de header, naast "TuinTaak": wisselen tussen de tuinen in
  // je account, Tuininstellingen openen en een nieuwe tuin toevoegen.
  // Alleen zichtbaar als je ingelogd bent en minstens één tuin hebt.
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { ui } from "../lib/state/ui.svelte.js";
  import AddGardenModal from "./AddGardenModal.svelte";
  import Dropdown from "./Dropdown.svelte";
  import Icon from "./Icon.svelte";

  // compact: smalle variant voor de mobiele kopbalk; krimpt mee met de
  // beschikbare ruimte (naam met ellipsis).
  let { compact = false } = $props();

  const current = $derived(gardenState.cloudGarden);
  let addOpen = $state(false);

  async function run(action) {
    try {
      await action();
    } catch (err) {
      alert(err.message ?? String(err));
    }
  }

  function select(id) {
    run(() => gardenState.selectGarden(id));
  }
</script>

<Dropdown minWidth={compact ? "min(17rem, calc(100vw - 2rem))" : "17rem"}>
  {#snippet trigger({ open, toggle })}
    <button
      type="button"
      class="garden-switcher"
      class:compact
      aria-haspopup="menu"
      aria-expanded={open}
      onclick={toggle}
    >
      <span class="garden-switcher-name">{current?.name ?? "Kies een tuin"}</span>
      <span class="menu-chevron" class:open><Icon name="chevron-down" size={16} /></span>
    </button>
  {/snippet}
  {#snippet menu(close)}
    {#each gardenState.gardens as garden (garden.id)}
      {@const selected = garden.id === current?.id}
      <button
        type="button"
        role="menuitem"
        class="menu-item"
        aria-current={selected ? "true" : undefined}
        onclick={() => {
          close();
          select(garden.id);
        }}
      >
        <span class="menu-item-label">
          <span>{garden.name}</span>
          {#if garden.role !== "owner"}<span class="menu-item-sub">Gedeeld met jou</span>{/if}
        </span>
        {#if selected}<span class="menu-item-icon"><Icon name="check" size={18} /></span>{/if}
      </button>
    {/each}
    <div class="menu-divider" role="separator"></div>
    <button
      type="button"
      role="menuitem"
      class="menu-item"
      onclick={() => {
        close();
        ui.gardenSettingsOpen = true;
      }}
    >
      <span class="menu-item-icon"><Icon name="flower" size={18} /></span>
      <span class="menu-item-label">
        <span>Tuininstellingen</span>
        <span class="menu-item-sub">Naam, delen, verwijderen</span>
      </span>
    </button>
    <div class="menu-divider" role="separator"></div>
    <button
      type="button"
      role="menuitem"
      class="menu-item"
      onclick={() => {
        close();
        addOpen = true;
      }}
    >
      <span class="menu-item-icon"><Icon name="plus-circle" size={18} /></span>
      <span class="menu-item-label">Nieuwe tuin toevoegen</span>
    </button>
  {/snippet}
</Dropdown>

{#if addOpen}
  <AddGardenModal onclose={() => (addOpen = false)} />
{/if}

<style>
  .garden-switcher {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    max-width: 18rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    font-size: var(--step0);
    font-weight: 500;
    line-height: var(--line-height-body);
    color: var(--color-primary-ink);
    cursor: pointer;
  }

  .garden-switcher.compact {
    max-width: 100%;
    height: 44px;
    font-size: var(--step-1);
  }

  .garden-switcher:hover,
  .garden-switcher[aria-expanded="true"] {
    background: rgba(255, 255, 255, 0.16);
  }

  .garden-switcher-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
