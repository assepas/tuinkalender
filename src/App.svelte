<script>
  import CalendarView from "./components/CalendarView.svelte";
  import TimelineView from "./components/TimelineView.svelte";
  import GardenEditor from "./components/GardenEditor.svelte";
  import LocationsPage from "./components/LocationsPage.svelte";
  import PrintView from "./components/PrintView.svelte";

  const tabs = [
    { id: "kalender", label: "Maandoverzicht" },
    { id: "tijdlijn", label: "Tijdlijn" },
    { id: "tuin", label: "Mijn tuin" },
    { id: "standplaatsen", label: "Standplaatsen" },
    { id: "print", label: "Print" },
  ];

  let activeTab = $state("kalender");
</script>

<div class="app-shell">
  <header class="app-header no-print">
    <div>
      <h1>TuinTaak</h1>
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

  {#if activeTab === "kalender"}
    <CalendarView />
  {:else if activeTab === "tijdlijn"}
    <TimelineView />
  {:else if activeTab === "tuin"}
    <GardenEditor />
  {:else if activeTab === "standplaatsen"}
    <LocationsPage />
  {:else}
    <PrintView />
  {/if}
</div>
