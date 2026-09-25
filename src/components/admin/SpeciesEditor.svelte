<script>
  // Formulier voor één soort, met live preview en validatie tegen hetzelfde
  // schema als `npm run validate`. Werkt op een kopie (draft); pas bij
  // "Opslaan" gaat het naar de database.
  import { catalog } from "../../lib/state/catalog.svelte.js";
  import {
    CATEGORY_ORDER,
    CATEGORY_LABELS,
    SUN_ORDER,
    SUN_LABELS,
    SOIL_ORDER,
    SOIL_LABELS,
    MOISTURE_ORDER,
    MOISTURE_LABELS,
  } from "../../lib/domain/plantings.js";
  import { validateSpecies, slugify } from "../../lib/domain/speciesValidation.js";
  import { saveSpecies, deleteSpecies } from "../../lib/storage/catalogAdmin.js";
  import { gardenState } from "../../lib/state/garden.svelte.js";
  import PlantIcon from "../PlantIcon.svelte";
  import MonthDayInput from "./MonthDayInput.svelte";
  import TaskEditor from "./TaskEditor.svelte";

  /** species: bestaande soort, of null voor een nieuwe. */
  let { species = null, onclose } = $props();

  const isNew = species === null;

  function blankSpecies() {
    return {
      schemaVersion: 1,
      id: "",
      name: "",
      latin: "",
      category: "vaste-plant",
      nativeStatus: "onbekend",
      appearance: { shape: "bloem", count: 5, flowerColor: "#D46A8C", flowerColorName: "" },
      bloom: { from: "05-01", to: "07-01" },
      tasks: [{ id: "planten", type: "planten", window: { kind: "dates", from: "03-15", to: "05-01" } }],
    };
  }

  let draft = $state(withEditableInfo(structuredClone($state.snapshot(species) ?? blankSpecies())));

  // Het formulier bindt direct op growing/info; lege velden haalt cleaned() weer weg.
  function withEditableInfo(s) {
    s.growing ??= {};
    s.info ??= {};
    return s;
  }
  let idTouched = $state(!isNew);
  let tab = $state("form"); // "form" | "json"
  let jsonText = $state("");
  let jsonError = $state("");
  let saving = $state(false);
  let saveError = $state("");
  let showErrors = $state(false);

  const NATIVE_LABELS = { inheems: "Inheems", archeofyt: "Archeofyt", exoot: "Exoot", onbekend: "Onbekend" };
  const SHAPE_LABELS = { bloem: "Bloem", aar: "Aar", vrucht: "Vrucht", "losse-wolk": "Losse wolk" };

  const errors = $derived(
    validateSpecies(cleaned(draft), {
      taskTypeIds: new Set(catalog.taskTypes.map((t) => t.id)),
      existingIds: new Set(catalog.speciesList.map((s) => s.id)),
      isNew,
    })
  );

  const usedInGarden = $derived(
    !isNew && gardenState.plantings.some((p) => p.speciesId === species.id)
  );

  /** Lege optionele velden weglaten, zodat de data net zo schoon blijft als de bronbestanden. */
  function cleaned(s) {
    const out = $state.snapshot(s);
    if (!out.latin) delete out.latin;
    if (!out.appearance?.flowerColorName) delete out.appearance?.flowerColorName;
    if (out.appearance && out.appearance.shape !== "vrucht" && !out.appearance.fruitColor) {
      delete out.appearance.fruitColor;
    }
    if (Array.isArray(out.tags) && out.tags.length === 0) delete out.tags;
    if (out.growing) {
      for (const k of ["sun", "soil", "moisture"]) if (!out.growing[k]?.length) delete out.growing[k];
      if (!out.growing.spacingCm) delete out.growing.spacingCm;
      if (Object.keys(out.growing).length === 0) delete out.growing;
    }
    if (out.info) {
      for (const k of ["intro", "water"]) if (!out.info[k]?.trim()) delete out.info[k];
      if (!out.info.tips?.length) delete out.info.tips;
      if (Object.keys(out.info).length === 0) delete out.info;
    }
    return out;
  }

  function setName(value) {
    draft.name = value;
    if (!idTouched) draft.id = slugify(value);
  }

  /** Zet of haalt één waarde weg uit een growing-lijst (checkboxgroep). */
  function toggleGrowing(field, value, on) {
    const current = new Set(draft.growing[field] ?? []);
    if (on) current.add(value);
    else current.delete(value);
    const order = { sun: SUN_ORDER, soil: SOIL_ORDER, moisture: MOISTURE_ORDER }[field];
    draft.growing[field] = order.filter((v) => current.has(v));
  }

  function setTips(value) {
    draft.info.tips = value
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function setSpacing(value) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) draft.growing.spacingCm = n;
    else delete draft.growing.spacingCm;
  }

  function setTags(value) {
    draft.tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function setShape(shape) {
    draft.appearance.shape = shape;
    if (shape === "vrucht" && !draft.appearance.fruitColor) draft.appearance.fruitColor = "#D1352B";
  }

  function toggleBloom(on) {
    if (on) draft.bloom = { from: "05-01", to: "07-01" };
    else delete draft.bloom;
  }

  function addTask() {
    const type = catalog.taskTypes[0]?.id ?? "onderhoud";
    draft.tasks.push({ id: `${type}-${draft.tasks.length + 1}`, type, window: { kind: "dates", from: "04-01", to: "05-01" } });
  }

  function openJson() {
    jsonText = JSON.stringify(cleaned(draft), null, 2);
    jsonError = "";
    tab = "json";
  }

  function applyJson(text) {
    jsonText = text;
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Verwacht een object { … }");
      parsed.appearance ??= { shape: "bloem", count: 5, flowerColor: "#5C6350" };
      parsed.tasks ??= [];
      draft = parsed;
      jsonError = "";
    } catch (err) {
      jsonError = err.message;
    }
  }

  async function save() {
    showErrors = true;
    if (errors.length > 0 || jsonError) return;
    saving = true;
    saveError = "";
    try {
      await saveSpecies(cleaned(draft));
      await catalog.refresh();
      onclose();
    } catch (err) {
      saveError = err.message ?? String(err);
    } finally {
      saving = false;
    }
  }

  async function remove() {
    const warning = usedInGarden
      ? `"${species.name}" staat in je huidige tuin (en misschien in tuinen van anderen). Die plantingen tonen daarna "onbekende soort". Toch verwijderen?`
      : `"${species.name}" verwijderen? Tuinen van anderen die deze soort gebruiken, tonen daarna "onbekende soort".`;
    if (!confirm(warning)) return;
    saving = true;
    saveError = "";
    try {
      await deleteSpecies(species.id);
      await catalog.refresh();
      onclose();
    } catch (err) {
      saveError = err.message ?? String(err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="panel species-editor">
  <div class="editor-head">
    <PlantIcon species={draft} size={56} />
    <div>
      <h2>{draft.name || "Nieuwe soort"}</h2>
      {#if draft.latin}<p class="latin">{draft.latin}</p>{/if}
    </div>
  </div>

  <div class="filter-bar">
    <button type="button" class="filter-chip" aria-pressed={tab === "form"} onclick={() => (tab = "form")}>
      Formulier
    </button>
    <button type="button" class="filter-chip" aria-pressed={tab === "json"} onclick={openJson}>JSON</button>
  </div>

  {#if tab === "form"}
    <h3>Algemeen</h3>
    <div class="field-grid">
      <div>
        <label for="sp-name">Naam</label>
        <input id="sp-name" type="text" value={draft.name} oninput={(e) => setName(e.currentTarget.value)} />
      </div>
      <div>
        <label for="sp-latin">Latijnse naam</label>
        <input id="sp-latin" type="text" bind:value={draft.latin} />
      </div>
      <div>
        <label for="sp-id">Id {#if !isNew}<span class="hint">(vast)</span>{/if}</label>
        <input
          id="sp-id"
          type="text"
          value={draft.id}
          readonly={!isNew}
          oninput={(e) => {
            idTouched = true;
            draft.id = e.currentTarget.value;
          }}
        />
      </div>
      <div>
        <label for="sp-category">Categorie</label>
        <select id="sp-category" bind:value={draft.category}>
          {#each CATEGORY_ORDER as c (c)}
            <option value={c}>{CATEGORY_LABELS[c]}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="sp-native">Herkomst</label>
        <select id="sp-native" bind:value={draft.nativeStatus}>
          {#each Object.entries(NATIVE_LABELS) as [key, label] (key)}
            <option value={key}>{label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="sp-tags">Tags <span class="hint">(komma's ertussen)</span></label>
        <input id="sp-tags" type="text" value={(draft.tags ?? []).join(", ")} onchange={(e) => setTags(e.currentTarget.value)} />
      </div>
    </div>

    <h3>Plantinformatie</h3>
    <div class="field-grid">
      {#each [["sun", "Licht", SUN_ORDER, SUN_LABELS], ["soil", "Grond", SOIL_ORDER, SOIL_LABELS], ["moisture", "Vocht", MOISTURE_ORDER, MOISTURE_LABELS]] as [field, title, order, labels] (field)}
        <fieldset class="check-group">
          <legend>{title}</legend>
          {#each order as value (value)}
            <label class="checkbox-label">
              <input
                type="checkbox"
                checked={draft.growing[field]?.includes(value) ?? false}
                onchange={(e) => toggleGrowing(field, value, e.currentTarget.checked)}
              />
              {labels[value]}
            </label>
          {/each}
        </fieldset>
      {/each}
      <div>
        <label for="sp-spacing">Plantafstand (cm)</label>
        <input id="sp-spacing" type="number" min="1" value={draft.growing.spacingCm ?? ""} onchange={(e) => setSpacing(e.currentTarget.value)} />
      </div>
    </div>
    <label for="sp-intro">Introductie <span class="hint">(wat voor plant, waarom kweken)</span></label>
    <textarea id="sp-intro" rows="3" bind:value={draft.info.intro}></textarea>
    <label for="sp-water" class="spaced-label">Water geven</label>
    <textarea id="sp-water" rows="2" bind:value={draft.info.water}></textarea>
    <label for="sp-tips" class="spaced-label">Tips <span class="hint">(één per regel)</span></label>
    <textarea id="sp-tips" rows="4" value={(draft.info.tips ?? []).join("\n")} onchange={(e) => setTips(e.currentTarget.value)}></textarea>

    <h3>Uiterlijk</h3>
    <div class="field-grid">
      <div>
        <label for="sp-shape">Vorm</label>
        <select id="sp-shape" value={draft.appearance.shape} onchange={(e) => setShape(e.currentTarget.value)}>
          {#each Object.entries(SHAPE_LABELS) as [key, label] (key)}
            <option value={key}>{label}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="sp-count">Aantal (1–10)</label>
        <input id="sp-count" type="number" min="1" max="10" bind:value={draft.appearance.count} />
      </div>
      <div>
        <label for="sp-flower">Bloemkleur</label>
        <span class="color-field">
          <input id="sp-flower" type="color" bind:value={draft.appearance.flowerColor} />
          <input type="text" aria-label="Bloemkleur (hex)" bind:value={draft.appearance.flowerColor} />
        </span>
      </div>
      <div>
        <label for="sp-flower-name">Naam bloemkleur</label>
        <input id="sp-flower-name" type="text" placeholder="bv. roze" bind:value={draft.appearance.flowerColorName} />
      </div>
      {#if draft.appearance.shape === "vrucht"}
        <div>
          <label for="sp-fruit">Vruchtkleur</label>
          <span class="color-field">
            <input id="sp-fruit" type="color" bind:value={draft.appearance.fruitColor} />
            <input type="text" aria-label="Vruchtkleur (hex)" bind:value={draft.appearance.fruitColor} />
          </span>
        </div>
      {/if}
    </div>

    <h3>Bloei</h3>
    <label class="checkbox-label">
      <input type="checkbox" checked={!!draft.bloom} onchange={(e) => toggleBloom(e.currentTarget.checked)} />
      Deze plant bloeit
    </label>
    {#if draft.bloom}
      <div class="field-grid">
        <div>
          <label for="sp-bloom-from">Van</label>
          <MonthDayInput id="sp-bloom-from" bind:value={draft.bloom.from} />
        </div>
        <div>
          <label for="sp-bloom-to">Tot en met</label>
          <MonthDayInput id="sp-bloom-to" bind:value={draft.bloom.to} />
        </div>
      </div>
    {/if}

    <h3>Taken</h3>
    {#each draft.tasks as task, i (i)}
      <TaskEditor bind:task={draft.tasks[i]} index={i} onremove={() => draft.tasks.splice(i, 1)} />
    {/each}
    <div class="btn-row">
      <button type="button" class="btn" onclick={addTask}>+ Taak toevoegen</button>
    </div>
  {:else}
    <p class="hint">
      Alle velden, ook die het formulier niet toont (zoals voorwaarden per taak). Wijzigingen hier gaan
      direct mee naar het formulier.
    </p>
    <textarea class="json-editor" spellcheck="false" value={jsonText} oninput={(e) => applyJson(e.currentTarget.value)}></textarea>
    {#if jsonError}<p class="error-text">Geen geldige JSON: {jsonError}</p>{/if}
  {/if}

  {#if showErrors && errors.length > 0}
    <div class="error-box" role="alert">
      <strong>Nog niet op te slaan:</strong>
      <ul>
        {#each errors as msg (msg)}<li>{msg}</li>{/each}
      </ul>
    </div>
  {/if}
  {#if saveError}<p class="error-text">{saveError}</p>{/if}

  <div class="btn-row editor-actions">
    <button type="button" class="btn btn-primary" disabled={saving} onclick={save}>
      {saving ? "Opslaan…" : "Opslaan"}
    </button>
    <button type="button" class="btn" disabled={saving} onclick={onclose}>Annuleren</button>
    {#if !isNew}
      <button type="button" class="btn btn-danger" disabled={saving} onclick={remove}>Soort verwijderen</button>
    {/if}
  </div>
</div>

<style>
  .editor-head {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .editor-head h2 {
    margin: 0;
  }

  .latin {
    margin: 0;
    font-style: italic;
    color: var(--color-ink-muted);
    font-size: var(--step-1);
  }

  .color-field {
    display: flex;
    gap: var(--space-2);
  }

  .color-field input[type="color"] {
    width: 3rem;
    padding: 2px;
    flex: none;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .checkbox-label input {
    width: auto;
  }

  .check-group {
    border: none;
    padding: 0;
    margin: 0;
  }

  .check-group legend {
    font-size: var(--step-1);
    color: var(--color-ink-muted);
    margin-bottom: var(--space-1);
  }

  .check-group .checkbox-label {
    margin-bottom: var(--space-1);
  }

  .spaced-label {
    margin-top: var(--space-3);
  }

  .json-editor {
    min-height: 28rem;
    font-family: var(--font-display);
    font-size: var(--step-1);
  }

  .error-box {
    border: 1px solid var(--color-danger);
    border-radius: var(--radius);
    padding: var(--space-3) var(--space-4);
    margin: var(--space-4) 0;
    color: var(--color-danger);
    font-size: var(--step-1);
  }

  .error-box ul {
    margin: var(--space-2) 0 0;
    padding-left: var(--space-5);
  }

  .editor-actions {
    margin-top: var(--space-4);
  }
</style>
