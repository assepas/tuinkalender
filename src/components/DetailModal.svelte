<script>
  import { MONTH_NAMES } from "../lib/domain/calendar.js";
  import Icon from "./Icon.svelte";
  import NativeBadge from "./NativeBadge.svelte";
  import PlantIcon from "./PlantIcon.svelte";
  import Modal from "./Modal.svelte";

  let { detail, onclose } = $props();

  function monthRangeLabel(months) {
    if (!months || months.length === 0) return "";
    if (months.length === 1) return MONTH_NAMES[months[0] - 1];
    return `${MONTH_NAMES[months[0] - 1]} t/m ${MONTH_NAMES[months[months.length - 1] - 1]}`;
  }
</script>

<Modal label="Details" {onclose}>
  {#if detail.kind === "species"}
    <div class="modal-head">
      <PlantIcon species={detail.species} size={44} />
      <div>
        <h2>{detail.planting.label || detail.species.name}</h2>
        {#if detail.species.latin}<p class="latin">{detail.species.latin}</p>{/if}
      </div>
    </div>
    <div class="modal-badges">
      <NativeBadge status={detail.species.nativeStatus} />
      {#if detail.species.appearance?.flowerColorName}
        <span class="swatch-chip">
          <span class="swatch" style:background={detail.species.appearance.flowerColor}></span>
          bloemkleur: {detail.species.appearance.flowerColorName}
        </span>
      {/if}
    </div>

    {#if detail.location}
      <p class="modal-meta">
        Standplaats: {detail.location.name}.
        {#if detail.location.soil}Grondsoort: {detail.location.soil}.{/if}
      </p>
    {:else if detail.planting.locationId}
      <p class="error-text">Onbekende standplaats — mogelijk verwijderd.</p>
    {/if}
    {#if detail.planting.notes}
      <p class="modal-meta">{detail.planting.notes}</p>
    {/if}

    <h3>Taken</h3>
    <ul class="modal-task-list">
      {#each detail.species.tasks as task (task.id)}
        <li>
          <strong>{task.type}</strong>
          {#if (detail.planting.mutedTasks ?? []).includes(task.id)}
            <span class="muted-note">(uitgeschakeld voor deze plant)</span>
          {/if}
          {#if task.note}<span class="task-note">— {task.note}</span>{/if}
        </li>
      {/each}
    </ul>
  {:else if detail.kind === "task"}
    <div class="modal-head">
      <span class="task-icon-badge" style:background={`${detail.meta?.color ?? "#999"}26`}>
        <Icon name={detail.meta?.icon ?? "dot"} color={detail.meta?.color ?? "#999"} size={22} />
      </span>
      <div>
        <h2>{detail.meta?.label ?? detail.taskType}</h2>
        <p class="latin">{detail.planting.label || detail.species.name}</p>
      </div>
    </div>
    {#if detail.entry.task.note}
      <p class="modal-meta">{detail.entry.task.note}</p>
    {/if}
    <p class="modal-meta">Actief: {monthRangeLabel(detail.entry.months)}</p>
    {#if detail.entry.frequency}
      <p class="modal-meta">Frequentie: {detail.entry.frequency}</p>
    {/if}
    {#if detail.entry.task.importance}
      <p class="modal-meta">
        Belang: {detail.entry.task.importance === "hoofd" ? "hoofdsnoei (nodig)" : "lichte/optionele snoei"}
      </p>
    {/if}
  {/if}
</Modal>

<style>
  .modal-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    padding-right: var(--space-5);
  }

  .modal-head h2 {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--step2);
    margin: 0;
  }

  .latin {
    font-style: italic;
    color: var(--color-ink-muted);
    font-size: var(--step-1);
    margin: 0;
  }

  .modal-badges {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .swatch-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--step-1);
    color: var(--color-ink-muted);
  }

  .swatch {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 999px;
    border: 1px solid var(--color-line-strong);
  }

  .task-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    flex: none;
  }

  .modal-meta {
    font-size: var(--step0);
    margin: 0 0 var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  h3 {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--step1);
    margin: var(--space-4) 0 var(--space-2);
  }

  .modal-task-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--step-1);
  }

  .task-note {
    color: var(--color-ink-muted);
  }

  .muted-note {
    color: var(--color-danger);
    font-size: 0.85em;
  }
</style>
