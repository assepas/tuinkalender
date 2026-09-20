<script>
  import { buildCalendar } from "../lib/domain/calendar.js";
  import { speciesIndex, taskTypeIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import Legend from "./Legend.svelte";

  let months = $derived(
    buildCalendar(gardenState.garden, speciesIndex, gardenState.regionProfile)
  );
</script>

<div class="no-print">
  <p class="print-hint">
    Dit is het printvoorbeeld. Gebruik de printknop van je browser (of de knop hieronder) en kies
    "Opslaan als PDF" om een printbaar bestand te krijgen.
  </p>
  <button type="button" class="btn btn-primary" onclick={() => window.print()}>
    Afdrukken / opslaan als PDF
  </button>
  <Legend />
</div>

<div class="print-page">
  {#each months as month (month.month)}
    <section class="print-month">
      <h2>{month.name}</h2>
      {#if month.entries.length === 0}
        <p class="empty">Geen taken deze maand.</p>
      {:else}
        {#each month.entries as entry (entry.plantingUid + entry.taskId)}
          <div class="print-task-row">
            <span class="dot" style:background={taskTypeIndex[entry.taskType]?.color ?? "#999"}></span>
            <span>
              <strong>{entry.label}</strong>
              — {taskTypeIndex[entry.taskType]?.label ?? entry.taskType}
              {#if entry.frequency}({entry.frequency}){/if}
              {#if entry.note}<br /><em>{entry.note}</em>{/if}
            </span>
          </div>
        {/each}
      {/if}
    </section>
  {/each}
</div>
