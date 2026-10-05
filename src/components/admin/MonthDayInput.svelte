<script>
  // Invoer voor een "MM-DD"-datum (zoals in de soortdata): maand + dag.
  import { MONTH_NAMES } from "../../lib/domain/calendar.js";
  import Select from "../Select.svelte";

  let { value = $bindable("01-01"), id = undefined } = $props();

  const options = MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));
  const month = $derived(Number(value?.slice(0, 2)) || 1);
  const day = $derived(Number(value?.slice(3, 5)) || 1);

  function set(m, d) {
    value = `${String(m).padStart(2, "0")}-${String(Math.min(Math.max(d, 1), 31)).padStart(2, "0")}`;
  }
</script>

<span class="month-day">
  <Select {id} class="month-day-month" {options} value={month} onchange={(m) => set(m, day)} />
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

  .month-day :global(.month-day-month) {
    min-width: 8.5rem;
  }

  .month-day input {
    width: 4.5rem;
  }
</style>
