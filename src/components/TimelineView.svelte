<script>
  import { buildTimelineRows, MONTH_NAMES } from "../lib/domain/calendar.js";
  import { toVisualSegments } from "../lib/domain/windows.js";
  import { speciesIndex, taskTypes, taskTypeIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import DetailModal from "./DetailModal.svelte";
  import Icon from "./Icon.svelte";
  import NativeBadge from "./NativeBadge.svelte";
  import PlantIcon from "./PlantIcon.svelte";

  const taskTypeOrder = taskTypes.map((t) => t.id);
  const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

  let rows = $derived(
    buildTimelineRows(gardenState.garden, speciesIndex, taskTypeIndex, gardenState.regionProfile, taskTypeOrder)
  );

  let selected = $state(null);

  function showSpecies(row) {
    selected = { kind: "species", species: row.species, planting: row.planting };
  }

  function showBloom(row, lane) {
    selected = { kind: "bloom", species: row.species, planting: row.planting, months: lane.months };
  }

  function showTask(row, lane, entry) {
    selected = {
      kind: "task",
      species: row.species,
      planting: row.planting,
      taskType: lane.taskType,
      meta: lane.meta,
      entry,
    };
  }
</script>

<div class="timeline-legend no-print">
  <span class="legend-item">
    <span class="legend-swatch bloom-swatch"></span>
    Bloei (in bloemkleur)
  </span>
  <span class="legend-item">
    <Icon name="scissors" color="var(--color-ink)" size={15} strokeWidth={2} />
    hoofdsnoei
  </span>
  <span class="legend-item">
    <span class="light-icon"><Icon name="scissors" color="var(--color-ink-faint)" size={15} strokeWidth={1.3} /></span>
    lichte/optionele snoei
  </span>
  {#each taskTypes.filter((t) => t.id !== "snoeien") as type (type.id)}
    <span class="legend-item">
      <Icon name={type.icon} color={type.color} size={15} />
      {type.label}
    </span>
  {/each}
  <span class="hint">Klik op een plant- of taakicoon voor details.</span>
</div>

{#if rows.length === 0}
  <p class="empty-state">
    Je tuin is nog leeg. Ga naar <strong>Mijn tuin</strong> om planten toe te voegen.
  </p>
{:else}
  <div class="timeline-scroll">
  <div class="timeline">
    <div class="timeline-header-row">
      <div class="timeline-head-spacer"></div>
      <div class="timeline-months">
        {#each MONTH_SHORT as label}
          <span class="timeline-month-label">{label}</span>
        {/each}
      </div>
    </div>

    {#each rows as row (row.planting.uid)}
      <div class="timeline-row">
        <button type="button" class="timeline-plant-head" onclick={() => showSpecies(row)}>
          <PlantIcon species={row.species} size={34} />
          <span class="timeline-plant-names">
            <span class="plant-name">{row.planting.label || row.species.name}</span>
            {#if row.species.latin}<span class="plant-latin">{row.species.latin}</span>{/if}
          </span>
          <NativeBadge status={row.species.nativeStatus} />
        </button>

        <div class="timeline-lanes">
          {#each row.lanes as lane (lane.kind + (lane.taskType ?? ""))}
            <div class="timeline-lane">
              <span class="lane-icon">
                {#if lane.kind === "bloom"}
                  <span class="lane-bloom-dot" style:background={lane.color}></span>
                {:else}
                  <Icon name={lane.meta?.icon ?? "dot"} color={lane.meta?.color ?? "#999"} size={14} />
                {/if}
              </span>
              <div class="lane-track">
                {#if lane.kind === "bloom"}
                  {#each toVisualSegments(lane.months) as [start, end] (start)}
                    <button
                      type="button"
                      class="lane-bar bloom-bar"
                      style:grid-column={`${start} / ${end + 1}`}
                      style:background={lane.color}
                      style:border-color={`${lane.color}99`}
                      onclick={() => showBloom(row, lane)}
                      title="Bloei"
                    ></button>
                  {/each}
                {:else if lane.meta?.markerStyle === "bar"}
                  {#each lane.entries as entry (entry.task.id)}
                    {#each toVisualSegments(entry.months) as [start, end] (start)}
                      <button
                        type="button"
                        class="lane-bar"
                        style:grid-column={`${start} / ${end + 1}`}
                        style:background={lane.meta.color}
                        onclick={() => showTask(row, lane, entry)}
                        title={lane.meta.label}
                      ></button>
                    {/each}
                  {/each}
                {:else if lane.meta?.markerStyle === "dot"}
                  {#each lane.entries as entry (entry.task.id)}
                    {#each entry.months as m}
                      <button
                        type="button"
                        class="lane-marker"
                        style:grid-column={`${m} / ${m + 1}`}
                        onclick={() => showTask(row, lane, entry)}
                        title={lane.meta.label}
                      >
                        <Icon name="dot" color={lane.meta.color} size={9} />
                      </button>
                    {/each}
                  {/each}
                {:else}
                  {#each lane.entries as entry (entry.task.id)}
                    {#each entry.months as m}
                      <button
                        type="button"
                        class="lane-marker"
                        class:light={entry.task.importance === "licht"}
                        style:grid-column={`${m} / ${m + 1}`}
                        onclick={() => showTask(row, lane, entry)}
                        title={lane.meta.label}
                      >
                        <Icon
                          name={lane.meta.icon}
                          color={lane.meta.color}
                          size={13}
                          strokeWidth={entry.task.importance === "licht" ? 1.2 : 1.8}
                        />
                      </button>
                    {/each}
                  {/each}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  </div>
{/if}

{#if selected}
  <DetailModal detail={selected} onclose={() => (selected = null)} />
{/if}
