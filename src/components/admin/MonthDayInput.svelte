<script>
  // Invoer voor een "MM-DD"-datum (zoals in de soortdata): maand + dag.
  import { MONTH_NAMES } from "../../lib/domain/calendar.js";

  let { value = $bindable("01-01"), id = undefined } = $props();

  const month = $derived(Number(value?.slice(0, 2)) || 1);
  const day = $derived(Number(value?.slice(3, 5)) || 1);

  function set(m, d) {
    value = `${String(m).padStart(2, "0")}-${String(Math.min(Math.max(d, 1), 31)).padStart(2, "0")}`;
  }
</script>

<span class="month-day">
  <select {id} value={month} onchange={(e) => set(Number(e.currentTarget.value), day)}>
    {#each MONTH_NAMES as name, i}
      <option value={i + 1}>{name}</option>
    {/each}
  </select>
  <input
    type="number"
    min="1"
    max="31"
    value={day}
    aria-label="Dag"
    onchange={(e) => set(month, Number(e.currentTarget.value))}
  />
</span>

<style>
  .month-day {
    display: inline-flex;
    gap: var(--space-1);
  }

  .month-day select {
    width: auto;
  }

  .month-day input {
    width: 4.5rem;
  }
</style>
