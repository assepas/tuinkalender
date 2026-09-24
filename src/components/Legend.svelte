<script>
  import { catalog } from "../lib/state/catalog.svelte.js";
</script>

<div class="legend no-print">
  {#each catalog.taskTypes as type (type.id)}
    <span class="legend-item">
      <span class="dot" style:background={type.color}></span>
      {type.label}
    </span>
  {/each}
</div>
