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
  import MobileHeader from "./components/MobileHeader.svelte";
  import MobileTabBar from "./components/MobileTabBar.svelte";
  import { auth } from "./lib/state/auth.svelte.js";
  import { gardenState } from "./lib/state/garden.svelte.js";
  import { ui } from "./lib/state/ui.svelte.js";
  import Tour from "./components/Tour.svelte";
  import { tour, startTour, maybeAutoStart } from "./lib/state/tour.svelte.js";
  import { onMount } from "svelte";

  // Nieuwkomers krijgen bij het eerste bezoek de rondleiding (Tour.svelte).
  onMount(maybeAutoStart);

  const tabs = [
    { id: "tijdlijn", label: "Tijdlijn", tour: "timeline" },
    { id: "kalender", label: "Maandoverzicht", tour: "calendar" },
  ];
  // "Mijn tuin ▾" in de header: een menu met deze twee weergaven.
  const gardenTabs = [
    { id: "tuin", label: "Planten", icon: "sprout", tour: "garden-menu" },
    { id: "standplaatsen", label: "Standplaatsen", short: "Plaatsen", icon: "location", tour: "locations" },
  ];
  const adminTab = { id: "beheer", label: "Plantendata", icon: "flower" };

  // Mobiel staan alle weergaven naast elkaar in de onderbalk.
  const mobileTabs = $derived([
    { id: "tijdlijn", label: "Tijdlijn", icon: "timeline", tour: "timeline" },
    { id: "kalender", label: "Maandoverzicht", short: "Maanden", icon: "calendar", tour: "calendar" },
    ...gardenTabs,
    ...(auth.isAdmin ? [adminTab] : []),
  ]);

  // Beheerpagina los laden: gewone bezoekers downloaden die code (en ajv) niet.
  const loadAdminPage = () => import("./components/admin/AdminPage.svelte");

  // Tijdlijn is de landingspagina; de titel in de header leidt daar ook naartoe.
  const homeTab = "tijdlijn";

  const gardenTabActive = $derived(gardenTabs.some((t) => t.id === ui.activeTab));
  const activeTitle = $derived(mobileTabs.find((t) => t.id === ui.activeTab)?.label);
</script>

{#if ui.isMobile}
  <MobileHeader title={activeTitle} onhome={() => (ui.activeTab = homeTab)} />
{/if}

<div class="app-shell">
  {#if !ui.isMobile}
    <header class="app-header no-print">
      <div class="app-header-brand">
        <h1>
          <a
            href="./"
            onclick={(e) => {
              e.preventDefault();
              ui.activeTab = homeTab;
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
            data-tour={tab.tour}
            aria-current={ui.activeTab === tab.id ? "page" : undefined}
            onclick={() => (ui.activeTab = tab.id)}
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
              data-tour="garden-menu locations"
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
                aria-current={ui.activeTab === tab.id ? "page" : undefined}
                onclick={() => {
                  close();
                  ui.activeTab = tab.id;
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
            title={adminTab.label}
            aria-current={ui.activeTab === "beheer" ? "page" : undefined}
            onclick={() => (ui.activeTab = "beheer")}
          >
            <Icon name="flower" size={20} />
          </button>
        {/if}
        <AccountMenu />
      </div>
    </header>
  {/if}

  {#if gardenState.notice}
    <p class="app-notice no-print">
      {gardenState.notice}
      <button type="button" class="filter-clear" aria-label="Melding sluiten" onclick={() => gardenState.dismissNotice()}>✕</button>
    </p>
  {/if}

  {#if ui.activeTab === "tijdlijn"}
    <TimelineView />
  {:else if ui.activeTab === "kalender"}
    <CalendarView />
  {:else if ui.activeTab === "tuin"}
    <GardenEditor />
  {:else if ui.activeTab === "standplaatsen"}
    <LocationsPage />
  {:else if ui.activeTab === "beheer" && auth.isAdmin}
    {#await loadAdminPage()}
      <p class="hint">Laden…</p>
    {:then { default: AdminPage }}
      <AdminPage />
    {:catch err}
      <p class="error-text">Beheerpagina laden mislukt: {err.message}</p>
    {/await}
  {/if}
</div>

{#if ui.isMobile}
  <MobileTabBar tabs={mobileTabs} active={ui.activeTab} onselect={(id) => (ui.activeTab = id)} />
{/if}

<!-- Rondleiding opnieuw: op desktop onopvallend rechtsonder; op mobiel in het
     accountvenster (AccountMenu.svelte), tenzij er geen account bestaat. -->
{#if !ui.isMobile || !auth.enabled}
  <button
    type="button"
    class="tour-help-button no-print"
    aria-label="Rondleiding"
    title="Rondleiding"
    onclick={startTour}
  >
    <Icon name="help" size={18} />
  </button>
{/if}

{#if tour.open}
  <Tour />
{/if}

{#if ui.gardenSettingsOpen}
  <GardenSettingsModal onclose={() => (ui.gardenSettingsOpen = false)} />
{/if}
