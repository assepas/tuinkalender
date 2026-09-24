<script>
  import CalendarView from "./components/CalendarView.svelte";
  import TimelineView from "./components/TimelineView.svelte";
  import GardenEditor from "./components/GardenEditor.svelte";
  import LocationsPage from "./components/LocationsPage.svelte";
  import AccountMenu from "./components/AccountMenu.svelte";
  import { auth } from "./lib/state/auth.svelte.js";

  const baseTabs = [
    { id: "tijdlijn", label: "Tijdlijn" },
    { id: "kalender", label: "Maandoverzicht" },
    { id: "tuin", label: "Mijn tuin" },
    { id: "standplaatsen", label: "Standplaatsen" },
  ];
  // Alleen voor beheerders. Of je echt mag schrijven, bepaalt de database
  // (RLS) — dit verbergt alleen de tab.
  const tabs = $derived(auth.isAdmin ? [...baseTabs, { id: "beheer", label: "Plantendata" }] : baseTabs);

  // Beheerpagina los laden: gewone bezoekers downloaden die code (en ajv) niet.
  const loadAdminPage = () => import("./components/admin/AdminPage.svelte");

  // Tijdlijn is de landingspagina; de titel in de header leidt daar ook naartoe.
  const homeTab = "tijdlijn";

  let activeTab = $state(homeTab);
</script>

<div class="app-shell">
  <header class="app-header no-print">
    <div>
      <h1>
        <a
          href="./"
          onclick={(e) => {
            e.preventDefault();
            activeTab = homeTab;
          }}>TuinTaak</a
        >
      </h1>
    </div>
    <nav class="tabs" aria-label="Weergave">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          aria-current={activeTab === tab.id ? "page" : undefined}
          onclick={() => (activeTab = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </nav>
    <AccountMenu />
  </header>

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
