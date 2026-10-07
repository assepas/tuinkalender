<script>
  // Onderbalk met de weergaven op mobiel (< 34rem). Actief = icoon in een
  // licht "blad" (dezelfde omkering als de actieve tab op desktop). Bij vijf
  // tabs (beheerders) worden de lange labels ingekort; de volledige naam
  // blijft het aria-label.
  import Icon from "./Icon.svelte";

  let { tabs, active, onselect } = $props();

  const tight = $derived(tabs.length > 4);
</script>

<nav class="mobile-tabbar no-print" aria-label="Weergave" style:--tab-count={tabs.length}>
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      class="mobile-tab"
      data-tour={tab.tour}
      aria-label={tab.label}
      aria-current={active === tab.id ? "page" : undefined}
      onclick={() => onselect(tab.id)}
    >
      <span class="mobile-tab-leaf"><Icon name={tab.icon} size={22} /></span>
      <span class="mobile-tab-label">{tight && tab.short ? tab.short : tab.label}</span>
    </button>
  {/each}
</nav>

<style>
  .mobile-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(var(--tab-count), minmax(0, 1fr));
    padding: var(--space-1) var(--space-1) calc(env(safe-area-inset-bottom, 0px) + var(--space-1));
    background: var(--color-surface-raised);
    border-top: 1px solid var(--color-line);
  }

  .mobile-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
    min-height: 56px;
    padding: var(--space-1) 0;
    background: transparent;
    border: none;
    color: var(--color-ink-muted);
    cursor: pointer;
  }

  .mobile-tab-leaf {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid transparent;
  }

  .mobile-tab-label {
    max-width: 100%;
    font-size: 0.6875rem;
    font-weight: 500;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-tab[aria-current="page"] {
    color: var(--color-primary);
  }

  .mobile-tab[aria-current="page"] .mobile-tab-leaf {
    background: var(--color-surface);
    border-color: var(--color-line);
  }

  .mobile-tab[aria-current="page"] .mobile-tab-label {
    font-weight: 600;
  }
</style>
