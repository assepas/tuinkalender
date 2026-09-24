<script>
  // Eén taak van een soort: type (+ variant), venster en notitie. Velden die
  // hier niet staan (bv. conditions) blijven gewoon behouden en zijn via het
  // JSON-tabblad te bewerken.
  import { catalog } from "../../lib/state/catalog.svelte.js";
  import MonthDayInput from "./MonthDayInput.svelte";

  let { task = $bindable(), index, onremove } = $props();

  const taskType = $derived(catalog.taskTypeIndex[task.type]);
  const prefix = $derived(`task-${index}`);

  const ANCHORS = { lastFrost: "laatste nachtvorst", firstFrost: "eerste nachtvorst", soilWarm: "bodem warm" };
  const EVERY = { week: "elke week", "2weeks": "om de 2 weken", month: "elke maand" };

  function setKind(kind) {
    const w = task.window ?? {};
    if (kind === "dates") task.window = { kind, from: w.from ?? "04-01", to: w.to ?? "05-01" };
    else if (kind === "recurring") task.window = { kind, from: w.from ?? "04-01", to: w.to ?? "09-01", every: w.every ?? "2weeks" };
    else task.window = { kind, anchor: w.anchor ?? "lastFrost", fromWeeks: w.fromWeeks ?? -2, toWeeks: w.toWeeks ?? 2 };
  }

  function setType(type) {
    // Het variantveld van het oude type hoort niet bij het nieuwe.
    const oldField = taskType?.variantBy;
    if (oldField) delete task[oldField];
    // Id volgt het type zolang je het niet zelf hebt aangepast.
    if (task.id === task.type || !task.id) task.id = type;
    task.type = type;
  }

  function setVariant(value) {
    const field = taskType.variantBy;
    if (value === taskType.defaultVariant) delete task[field];
    else task[field] = value;
  }

  function setNote(value) {
    if (value) task.note = value;
    else delete task.note;
  }
</script>

<fieldset class="task-editor">
  <legend>Taak {index + 1}</legend>
  <div class="field-grid">
    <div>
      <label for="{prefix}-type">Type</label>
      <select id="{prefix}-type" value={task.type} onchange={(e) => setType(e.currentTarget.value)}>
        {#each catalog.taskTypes as t (t.id)}
          <option value={t.id}>{t.label}</option>
        {/each}
      </select>
    </div>
    {#if taskType?.variants}
      <div>
        <label for="{prefix}-variant">Variant</label>
        <select
          id="{prefix}-variant"
          value={task[taskType.variantBy] ?? taskType.defaultVariant}
          onchange={(e) => setVariant(e.currentTarget.value)}
        >
          {#each Object.entries(taskType.variants) as [key, v] (key)}
            <option value={key}>{v.label}</option>
          {/each}
        </select>
      </div>
    {/if}
    <div>
      <label for="{prefix}-id">Taak-id</label>
      <input id="{prefix}-id" type="text" bind:value={task.id} />
    </div>
    <div>
      <label for="{prefix}-kind">Wanneer</label>
      <select id="{prefix}-kind" value={task.window?.kind} onchange={(e) => setKind(e.currentTarget.value)}>
        <option value="dates">Tussen twee data</option>
        <option value="recurring">Terugkerend</option>
        <option value="relative">Rond vorst/bodemtemperatuur</option>
      </select>
    </div>
  </div>

  <div class="field-grid">
    {#if task.window?.kind === "dates" || task.window?.kind === "recurring"}
      <div>
        <label for="{prefix}-from">Van</label>
        <MonthDayInput id="{prefix}-from" bind:value={task.window.from} />
      </div>
      <div>
        <label for="{prefix}-to">Tot en met</label>
        <MonthDayInput id="{prefix}-to" bind:value={task.window.to} />
      </div>
      {#if task.window.kind === "recurring"}
        <div>
          <label for="{prefix}-every">Hoe vaak</label>
          <select id="{prefix}-every" bind:value={task.window.every}>
            {#each Object.entries(EVERY) as [key, label] (key)}
              <option value={key}>{label}</option>
            {/each}
          </select>
        </div>
      {/if}
    {:else if task.window?.kind === "relative"}
      <div>
        <label for="{prefix}-anchor">Ten opzichte van</label>
        <select id="{prefix}-anchor" bind:value={task.window.anchor}>
          {#each Object.entries(ANCHORS) as [key, label] (key)}
            <option value={key}>{label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="{prefix}-fromw">Van (weken)</label>
        <input id="{prefix}-fromw" type="number" bind:value={task.window.fromWeeks} />
      </div>
      <div>
        <label for="{prefix}-tow">Tot (weken)</label>
        <input id="{prefix}-tow" type="number" bind:value={task.window.toWeeks} />
      </div>
    {/if}
  </div>

  <label for="{prefix}-note">Notitie</label>
  <input id="{prefix}-note" type="text" value={task.note ?? ""} oninput={(e) => setNote(e.currentTarget.value)} />

  {#if task.conditions}
    <p class="hint">Deze taak heeft voorwaarden (conditions); die zijn te bewerken in het JSON-tabblad.</p>
  {/if}

  <div class="btn-row task-actions">
    <button type="button" class="btn btn-danger" onclick={onremove}>Taak verwijderen</button>
  </div>
</fieldset>

<style>
  .task-editor {
    border: var(--border);
    border-radius: var(--radius);
    padding: var(--space-3) var(--space-4);
    margin: 0 0 var(--space-3);
  }

  .task-editor legend {
    font-size: var(--step-1);
    color: var(--color-ink-muted);
    padding: 0 var(--space-1);
  }

  .task-editor .field-grid {
    margin-bottom: var(--space-3);
  }

  .task-actions {
    margin-top: var(--space-3);
  }
</style>
