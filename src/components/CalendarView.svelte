<script>
  import { buildCalendar } from "../lib/domain/calendar.js";
  import { speciesIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import Legend from "./Legend.svelte";
  import MonthCard from "./MonthCard.svelte";

  let months = $derived(
    buildCalendar(gardenState.garden, speciesIndex, gardenState.regionProfile)
  );
</script>

<Legend />

{#if gardenState.plantings.length === 0}
  <p class="empty-state">
    Je tuin is nog leeg. Ga naar <strong>Mijn tuin</strong> om planten toe te voegen — de kalender
    vult zich daar automatisch mee.
  </p>
{:else}
  <div class="calendar-grid">
    {#each months as month (month.month)}
      <MonthCard {month} />
    {/each}
  </div>
{/if}
