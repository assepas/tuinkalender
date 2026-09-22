<script>
  import { buildTimelineRows, MONTH_NAMES } from "../lib/domain/calendar.js";
  import { outlineColor } from "../lib/domain/color.js";
  import { toVisualSegments } from "../lib/domain/windows.js";
  import { speciesIndex, taskTypes, taskTypeIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import DetailModal from "./DetailModal.svelte";
  import Icon from "./Icon.svelte";
  import PlantIcon from "./PlantIcon.svelte";

  // Alleen taaktypes met "timeline": true in taskTypes.json komen in de tijdlijn.
  const timelineTypes = taskTypes.filter((t) => t.timeline);
  const taskTypeOrder = timelineTypes.map((t) => t.id);

  // Legenda: elk taaktype, of per variant als het type varianten heeft.
  const legendItems = timelineTypes.flatMap((t) =>
    t.variants
      ? Object.entries(t.variants).map(([key, v]) => ({ ...t, ...v, key: `${t.id}-${key}` }))
      : [{ key: t.id, ...t }]
  );
  const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

  let rows = $derived(
    buildTimelineRows(gardenState.garden, speciesIndex, taskTypeIndex, gardenState.regionProfile, taskTypeOrder)
  );

  let selected = $state(null);

  function showSpecies(row) {
    selected = { kind: "species", species: row.species, planting: row.planting };
  }

  function showTask(row, marker) {
    selected = {
      kind: "task",
      species: row.species,
      planting: row.planting,
      taskType: marker.taskType,
      meta: marker.meta,
      entry: marker.entry,
    };
  }

  // Bars (markerStyle "bar", bv. oogsten) hebben geen los marker-object per
  // maand — de eerste entry is representatief genoeg voor het detailvenster.
  function showBar(row, bar) {
    selected = {
      kind: "task",
      species: row.species,
      planting: row.planting,
      taskType: bar.taskType,
      meta: bar.meta,
      entry: bar.entries[0],
    };
  }
</script>

<div class="timeline-legend no-print">
  <span class="legend-item">
    <span class="legend-swatch bloom-swatch"></span>
    Bloei (in bloemkleur)
  </span>
  {#each legendItems as item (item.key)}
    <span class="legend-item">
      <span class="marker-chip" class:light={item.light}>
        <Icon name={item.icon} color={item.color} size={16} strokeWidth={item.light ? 1.2 : 1.8} />
      </span>
      {item.label}
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
        </button>

        <div class="lane-track">
          {#if row.bloom}
            {#each toVisualSegments(row.bloom.months) as [start, end] (start)}
              <!-- Puur informatief (geen taak), dus geen button/onclick — zie DetailModal. -->
              <div
                class="bloom-bar"
                style:grid-column={`${start} / ${end + 1}`}
                style:background={row.bloom.color}
                style:border-color={outlineColor(row.bloom.color)}
                title="Bloei"
              ></div>
            {/each}
          {/if}
          {#each row.bars as bar (bar.taskType)}
            {#each toVisualSegments(bar.months) as [start, end] (start)}
              <div
                class="task-bar-segment"
                style:grid-column={`${start} / ${end + 1}`}
                style:--bar-color={bar.meta.color}
              >
                <button
                  type="button"
                  class="task-bar-line"
                  onclick={() => showBar(row, bar)}
                  title={bar.meta.label}
                  aria-label={bar.meta.label}
                ></button>
                <button
                  type="button"
                  class="task-bar-end"
                  onclick={() => showBar(row, bar)}
                  title={bar.meta.label}
                  aria-label={bar.meta.label}
                >
                  <Icon name={bar.meta.icon} color={bar.meta.color} size={16} strokeWidth={1.8} />
                </button>
              </div>
            {/each}
          {/each}
          {#each row.cells as markers, i}
            {#if markers.length > 0}
              <div class="month-cell" style:grid-column={`${i + 1} / ${i + 2}`}>
                {#each markers as marker}
                  <button
                    type="button"
                    class="marker-chip"
                    class:light={marker.meta.light}
                    onclick={() => showTask(row, marker)}
                    title={marker.meta.label}
                    aria-label={marker.meta.label}
                  >
                    <Icon
                      name={marker.meta.icon}
                      color={marker.meta.color}
                      size={16}
                      strokeWidth={marker.meta.light ? 1.2 : 1.8}
                    />
                  </button>
                {/each}
              </div>
            {/if}
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
