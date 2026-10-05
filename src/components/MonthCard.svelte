<script>
  // Eén maand in het Maandoverzicht: per taaktype een subkopje (in de
  // volgorde van de legenda), daaronder de planten. Een plant is klikbaar
  // (onselect) voor de uitleg over de taak en de plant.
  import { groupEntriesByType } from "../lib/domain/calendar.js";
  import { catalog } from "../lib/state/catalog.svelte.js";

  // current: de huidige maand — uitgelicht met een rand en een "Nu"-pil.
  // clone: kopie in de doorlopende carousel (CalendarView.svelte) — verborgen
  // voor schermlezers en niet in de tabvolgorde, wel klikbaar.
  let { month, current = false, clone = false, onselect } = $props();

  const groups = $derived(groupEntriesByType(month.entries, catalog.taskTypes));
</script>

<article
  class="month-card"
  class:current
  aria-current={current && !clone ? "date" : undefined}
  aria-hidden={clone || undefined}
>
  <h2>{month.name}{#if current}<span class="month-card-now">Nu</span>{/if}</h2>
  {#if groups.length === 0}
    <p class="empty">Geen taken deze maand.</p>
  {:else}
    {#each groups as group (group.taskType)}
      {@const type = catalog.taskTypeIndex[group.taskType]}
      <section class="task-group">
        <h3 class="task-group-heading">{type?.label ?? group.taskType}</h3>
        <ul class="task-list">
          {#each group.entries as entry (entry.plantingUid + entry.taskId)}
            <li class="task-row">
              <span class="dot" style:background={type?.color ?? "#999"}></span>
              <span class="task-row-text">
                <button type="button" class="plant" tabindex={clone ? -1 : undefined} onclick={() => onselect?.(entry)}>{entry.label}</button>
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
      </section>
    {/each}
  {/if}
</article>
