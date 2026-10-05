<script>
  // Kopbalk op mobiel (< 34rem): één regel, vastgeplakt bovenaan. De
  // weergaven zitten in de onderbalk (MobileTabBar.svelte); hier alleen merk,
  // tuinkiezer (of de schermtitel als er geen tuinen zijn) en account.
  import AccountMenu from "./AccountMenu.svelte";
  import GardenSwitcher from "./GardenSwitcher.svelte";
  import { auth } from "../lib/state/auth.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";

  let { title, onhome } = $props();

  const showSwitcher = $derived(auth.user && gardenState.gardens.length > 0);
</script>

<header class="mobile-header no-print">
  <h1>
    <a
      href="./"
      onclick={(e) => {
        e.preventDefault();
        onhome?.();
      }}>TuinTaak</a
    >
  </h1>
  <div class="mobile-header-middle">
    {#if showSwitcher}
      <GardenSwitcher compact />
    {:else if title}
      <span class="mobile-header-title">
        <span class="mobile-header-rule" aria-hidden="true"></span>
        <span class="mobile-header-title-text">{title}</span>
      </span>
    {/if}
  </div>
  <AccountMenu compact />
</header>

<style>
  .mobile-header {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 60px;
    padding: calc(env(safe-area-inset-top, 0px) + var(--space-2)) var(--space-3) var(--space-2) var(--space-4);
    background: var(--color-primary);
  }

  h1 {
    flex: none;
    display: flex;
    align-items: center;
    height: 44px;
    margin: 0;
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--step2);
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--color-primary-ink);
  }

  h1 a {
    color: inherit;
    text-decoration: none;
  }

  .mobile-header-middle {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    height: 44px;
  }

  /* De Dropdown-wrapper van de tuinkiezer mag krimpen, zodat de naam een
     ellipsis krijgt i.p.v. de accountknop van het scherm te duwen. */
  .mobile-header-middle :global(.dropdown) {
    min-width: 0;
    max-width: 100%;
  }

  .mobile-header-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    height: 100%;
    padding-left: var(--space-1);
  }

  .mobile-header-rule {
    flex: none;
    width: 1px;
    height: 1.25rem;
    background: var(--color-primary-muted);
    opacity: 0.6;
  }

  .mobile-header-title-text {
    font-family: var(--font-display);
    font-size: var(--step1);
    font-weight: 400;
    line-height: 1;
    color: var(--color-primary-ink);
    opacity: 0.85;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
