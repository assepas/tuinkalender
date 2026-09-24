<script>
  // Inhoud van de printmodal op het maandoverzicht: uitleg, afdrukknop en het
  // A4-voorbeeld. Bij afdrukken blijft alleen .print-page over (zie print.css).
  import { catalog } from "../lib/state/catalog.svelte.js";

  let { months } = $props();
</script>

<div class="no-print">
  <p class="print-hint">
    Kies bij het afdrukken "Opslaan als PDF" om een printbaar bestand te krijgen.
  </p>
  <p>
    <button type="button" class="btn btn-primary" onclick={() => window.print()}>
      Afdrukken / opslaan als PDF
    </button>
  </p>
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
            <span class="dot" style:background={catalog.taskTypeIndex[entry.taskType]?.color ?? "#999"}></span>
            <span>
              <strong>{entry.label}</strong>
              — {catalog.taskTypeIndex[entry.taskType]?.label ?? entry.taskType}
              {#if entry.frequency}({entry.frequency}){/if}
              {#if entry.note}<br /><em>{entry.note}</em>{/if}
            </span>
          </div>
        {/each}
      {/if}
    </section>
  {/each}
</div>
