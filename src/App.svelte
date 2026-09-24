<script>
  import CalendarView from "./components/CalendarView.svelte";
  import TimelineView from "./components/TimelineView.svelte";
  import GardenEditor from "./components/GardenEditor.svelte";
  import LocationsPage from "./components/LocationsPage.svelte";

  const tabs = [
    { id: "tijdlijn", label: "Tijdlijn" },
    { id: "kalender", label: "Maandoverzicht" },
    { id: "tuin", label: "Mijn tuin" },
    { id: "standplaatsen", label: "Standplaatsen" },
  ];

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
  </header>

  {#if activeTab === "tijdlijn"}
    <TimelineView />
  {:else if activeTab === "kalender"}
    <CalendarView />
  {:else if activeTab === "tuin"}
    <GardenEditor />
  {:else if activeTab === "standplaatsen"}
    <LocationsPage />
  {/if}
</div>
