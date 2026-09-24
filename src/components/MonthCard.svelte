<script>
  import { catalog } from "../lib/state/catalog.svelte.js";

  let { month } = $props();
</script>

<article class="month-card">
  <h2>{month.name}</h2>
  {#if month.entries.length === 0}
    <p class="empty">Geen taken deze maand.</p>
  {:else}
    <ul class="task-list">
      {#each month.entries as entry (entry.plantingUid + entry.taskId)}
        <li class="task-row">
          <span class="dot" style:background={catalog.taskTypeIndex[entry.taskType]?.color ?? "#999"}></span>
          <span>
            <span class="plant">{entry.label}</span>
            <span class="task-type">— {catalog.taskTypeIndex[entry.taskType]?.label ?? entry.taskType}</span>
            {#if entry.frequency}
              <span class="meta">{entry.frequency}</span>
            {/if}
            {#if entry.note}
              <span class="meta">{entry.note}</span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</article>
