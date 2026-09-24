<script>
  import { buildCalendar } from "../lib/domain/calendar.js";
  import { catalog } from "../lib/state/catalog.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import Legend from "./Legend.svelte";
  import Modal from "./Modal.svelte";
  import MonthCard from "./MonthCard.svelte";
  import PrintView from "./PrintView.svelte";

  let months = $derived(
    buildCalendar(gardenState.garden, catalog.speciesIndex, gardenState.regionProfile)
  );

  let printOpen = $state(false);
</script>

<div class="calendar-toolbar no-print">
  <Legend />
  {#if gardenState.plantings.length > 0}
    <button type="button" class="btn" onclick={() => (printOpen = true)}>Printen</button>
  {/if}
</div>

{#if gardenState.plantings.length === 0}
  <p class="empty-state">
    Je tuin is nog leeg. Ga naar <strong>Mijn tuin</strong> om planten toe te voegen — de kalender
    vult zich daar automatisch mee.
  </p>
{:else}
  <div class="calendar-grid no-print">
    {#each months as month (month.month)}
      <MonthCard {month} />
    {/each}
  </div>
{/if}

{#if printOpen}
  <Modal title="Printvoorbeeld" wide printable onclose={() => (printOpen = false)}>
    <PrintView {months} />
  </Modal>
{/if}
