<script>
  // Eén taak van een soort: type (+ variant), venster en notitie. Velden die
  // hier niet staan (bv. conditions) blijven gewoon behouden en zijn via het
  // JSON-tabblad te bewerken.
  import { catalog } from "../../lib/state/catalog.svelte.js";
  import Select from "../Select.svelte";
  import MonthDayInput from "./MonthDayInput.svelte";

  let { task = $bindable(), index, onremove } = $props();

  const taskType = $derived(catalog.taskTypeIndex[task.type]);
  const prefix = $derived(`task-${index}`);

  const ANCHORS = { lastFrost: "laatste nachtvorst", firstFrost: "eerste nachtvorst", soilWarm: "bodem warm" };
  const EVERY = { week: "elke week", "2weeks": "om de 2 weken", month: "elke maand" };
  const KINDS = [
    { value: "dates", label: "Tussen twee data" },
    { value: "recurring", label: "Terugkerend" },
    { value: "relative", label: "Rond vorst/bodemtemperatuur" },
  ];
  const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

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

  function setDescription(value) {
    if (value.trim()) task.description = value;
    else delete task.description;
  }
</script>

<fieldset class="task-editor">
  <legend>Taak {index + 1}</legend>
  <div class="field-grid">
    <div>
      <label for="{prefix}-type">Type</label>
      <Select
        id="{prefix}-type"
        options={catalog.taskTypes.map((t) => ({ value: t.id, label: t.label }))}
        value={task.type}
        onchange={setType}
      />
    </div>
    {#if taskType?.variants}
      <div>
        <label for="{prefix}-variant">Variant</label>
        <Select
          id="{prefix}-variant"
          options={Object.entries(taskType.variants).map(([key, v]) => ({ value: key, label: v.label }))}
          value={task[taskType.variantBy] ?? taskType.defaultVariant}
          onchange={setVariant}
        />
      </div>
    {/if}
    <div>
      <label for="{prefix}-id">Taak-id</label>
      <input id="{prefix}-id" type="text" bind:value={task.id} />
    </div>
    <div>
      <label for="{prefix}-kind">Wanneer</label>
      <Select id="{prefix}-kind" options={KINDS} value={task.window?.kind} onchange={setKind} />
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
          <Select id="{prefix}-every" options={toOptions(EVERY)} bind:value={task.window.every} />
        </div>
      {/if}
    {:else if task.window?.kind === "relative"}
      <div>
        <label for="{prefix}-anchor">Ten opzichte van</label>
        <Select id="{prefix}-anchor" options={toOptions(ANCHORS)} bind:value={task.window.anchor} />
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

  <label for="{prefix}-description">Uitleg <span class="hint">(detailvenster: hoe, waar op letten, waarom)</span></label>
  <textarea
    id="{prefix}-description"
    rows="3"
    value={task.description ?? ""}
    oninput={(e) => setDescription(e.currentTarget.value)}
  ></textarea>

  <label for="{prefix}-note" class="note-label">
    Korte notitie <span class="hint">(maandoverzicht en print — alleen als het echt nodig is)</span>
  </label>
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

  .note-label {
    margin-top: var(--space-3);
  }

  .task-actions {
    margin-top: var(--space-3);
  }
</style>
