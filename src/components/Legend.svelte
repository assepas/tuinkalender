<script>
  import { taskTypes } from "../lib/generated/data.js";
</script>

<div class="legend no-print">
  {#each taskTypes as type (type.id)}
    <span class="legend-item">
      <span class="dot" style:background={type.color}></span>
      {type.label}
    </span>
  {/each}
</div>
