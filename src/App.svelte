<script>
  import CalendarView from "./components/CalendarView.svelte";
  import TimelineView from "./components/TimelineView.svelte";
  import GardenEditor from "./components/GardenEditor.svelte";
  import LocationsPage from "./components/LocationsPage.svelte";
  import AccountMenu from "./components/AccountMenu.svelte";
  import Dropdown from "./components/Dropdown.svelte";
  import GardenSettingsModal from "./components/GardenSettingsModal.svelte";
  import GardenSwitcher from "./components/GardenSwitcher.svelte";
  import Icon from "./components/Icon.svelte";
  import { auth } from "./lib/state/auth.svelte.js";
  import { gardenState } from "./lib/state/garden.svelte.js";
  import { ui } from "./lib/state/ui.svelte.js";

  const tabs = [
    { id: "tijdlijn", label: "Tijdlijn" },
    { id: "kalender", label: "Maandoverzicht" },
  ];
  // "Mijn tuin ▾" in de header: een menu met deze twee weergaven.
  const gardenTabs = [
    { id: "tuin", label: "Planten", icon: "sprout" },
    { id: "standplaatsen", label: "Standplaatsen", icon: "location" },
  ];

  // Beheerpagina los laden: gewone bezoekers downloaden die code (en ajv) niet.
  const loadAdminPage = () => import("./components/admin/AdminPage.svelte");

  // Tijdlijn is de landingspagina; de titel in de header leidt daar ook naartoe.
  const homeTab = "tijdlijn";

  let activeTab = $state(homeTab);
  const gardenTabActive = $derived(gardenTabs.some((t) => t.id === activeTab));
</script>

<div class="app-shell">
  <header class="app-header no-print">
    <div class="app-header-brand">
      <h1>
        <a
          href="./"
          onclick={(e) => {
            e.preventDefault();
            activeTab = homeTab;
          }}>TuinTaak</a
        >
      </h1>
      {#if auth.user && gardenState.gardens.length > 0}
        <GardenSwitcher />
      {/if}
    </div>
    <nav class="tabs" aria-label="Weergave">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          class="tab"
          aria-current={activeTab === tab.id ? "page" : undefined}
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
      <span class="tabs-separator" aria-hidden="true"></span>
      <Dropdown align="right" minWidth="13rem">
        {#snippet trigger({ open, toggle })}
          <button
            type="button"
            class="tab tab-menu"
            aria-current={gardenTabActive ? "page" : undefined}
            aria-haspopup="menu"
            aria-expanded={open}
            onclick={toggle}
          >
            Mijn tuin
            <span class="menu-chevron" class:open><Icon name="chevron-down" size={14} /></span>
          </button>
        {/snippet}
        {#snippet menu(close)}
          {#each gardenTabs as tab (tab.id)}
            <button
              type="button"
              role="menuitem"
              class="menu-item"
              aria-current={activeTab === tab.id ? "page" : undefined}
              onclick={() => {
                close();
                activeTab = tab.id;
              }}
            >
              <span class="menu-item-icon"><Icon name={tab.icon} size={18} /></span>
              <span class="menu-item-label">{tab.label}</span>
            </button>
          {/each}
        {/snippet}
      </Dropdown>
    </nav>
    <div class="app-header-account">
      <!-- Alleen voor beheerders. Of je echt mag schrijven, bepaalt de
           database (RLS) — dit verbergt alleen de knop. -->
      {#if auth.isAdmin}
        <button
          type="button"
          class="admin-button"
          aria-label="Plantendata beheren"
          title="Plantendata"
          aria-current={activeTab === "beheer" ? "page" : undefined}
          onclick={() => (activeTab = "beheer")}
        >
          <Icon name="flower" size={20} />
        </button>
      {/if}
      <AccountMenu />
    </div>
  </header>

  {#if gardenState.notice}
    <p class="app-notice no-print">
      {gardenState.notice}
      <button type="button" class="filter-clear" aria-label="Melding sluiten" onclick={() => gardenState.dismissNotice()}>✕</button>
    </p>
  {/if}

  {#if activeTab === "tijdlijn"}
    <TimelineView />
  {:else if activeTab === "kalender"}
    <CalendarView />
  {:else if activeTab === "tuin"}
    <GardenEditor />
  {:else if activeTab === "standplaatsen"}
    <LocationsPage />
  {:else if activeTab === "beheer" && auth.isAdmin}
    {#await loadAdminPage()}
      <p class="hint">Laden…</p>
    {:then { default: AdminPage }}
      <AdminPage />
    {:catch err}
      <p class="error-text">Beheerpagina laden mislukt: {err.message}</p>
    {/await}
  {/if}
</div>

{#if ui.gardenSettingsOpen}
  <GardenSettingsModal onclose={() => (ui.gardenSettingsOpen = false)} />
{/if}
