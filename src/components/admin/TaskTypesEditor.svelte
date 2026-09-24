<script>
  // Label, kleur, icoon en "in tijdlijn" per taaktype. Varianten en de
  // overige velden blijven zoals ze zijn (die bepalen hoe taken werken).
  import { catalog } from "../../lib/state/catalog.svelte.js";
  import { saveTaskType } from "../../lib/storage/catalogAdmin.js";
  import Icon from "../Icon.svelte";

  const ICONS = ["seed", "seed-kas", "sprout", "droplet", "leaf", "scissors", "split", "snowflake", "basket", "poop", "ellipsis", "dot", "dot-outline"];
  const HEX = /^#[0-9a-fA-F]{6}$/;

  let drafts = $state(structuredClone($state.snapshot(catalog.taskTypes)));
  let savingId = $state(null);
  let savedId = $state(null);
  let error = $state("");

  const originals = $derived(catalog.taskTypeIndex);

  function changed(t) {
    const o = originals[t.id];
    return !o || o.label !== t.label || o.color !== t.color || o.icon !== t.icon || !!o.timeline !== !!t.timeline;
  }

  async function save(t, sort) {
    error = "";
    if (!t.label.trim()) return (error = "Een taaktype moet een naam hebben.");
    if (!HEX.test(t.color)) return (error = `Kleur van "${t.label}": gebruik een kleur als #A1B2C3.`);
    savingId = t.id;
    try {
      await saveTaskType($state.snapshot(t), sort);
      await catalog.refresh();
      savedId = t.id;
    } catch (err) {
      error = err.message ?? String(err);
    } finally {
      savingId = null;
    }
  }
</script>

<div class="panel">
  <h2>Taaktypes</h2>
  <p class="hint">
    Naam, kleur en icoon zoals ze in de tijdlijn, het maandoverzicht en de legenda verschijnen.
  </p>
  <ul class="task-type-list">
    {#each drafts as t, i (t.id)}
      <li class="task-type-row">
        <span class="marker-chip" style:--chip-color={t.color}>
          <Icon name={t.icon} color={t.color} size={16} strokeWidth={1.8} />
        </span>
        <input type="text" aria-label="Naam" bind:value={t.label} />
        <span class="color-field">
          <input type="color" aria-label="Kleur" bind:value={t.color} />
          <input type="text" aria-label="Kleur (hex)" bind:value={t.color} />
        </span>
        <select aria-label="Icoon" bind:value={t.icon}>
          {#each ICONS as icon (icon)}<option value={icon}>{icon}</option>{/each}
        </select>
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={t.timeline} /> In tijdlijn
        </label>
        <button
          type="button"
          class="btn"
          class:btn-primary={changed(t)}
          disabled={savingId === t.id || !changed(t)}
          onclick={() => save(t, i)}
        >
          {savingId === t.id ? "Opslaan…" : savedId === t.id && !changed(t) ? "Opgeslagen ✓" : "Opslaan"}
        </button>
      </li>
    {/each}
  </ul>
  {#if error}<p class="error-text">{error}</p>{/if}
</div>

<style>
  .task-type-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .task-type-row {
    display: grid;
    grid-template-columns: 22px minmax(8rem, 1fr) 11rem 9rem auto 7.5rem;
    align-items: center;
    gap: var(--space-3);
  }

  .color-field {
    display: flex;
    gap: var(--space-2);
  }

  .color-field input[type="color"] {
    width: 2.5rem;
    padding: 2px;
    flex: none;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    white-space: nowrap;
  }

  .checkbox-label input {
    width: auto;
  }

  @media (max-width: 48rem) {
    .task-type-row {
      grid-template-columns: 22px 1fr;
    }
  }
</style>
