<script>
  // Beheer van de plantendata (alleen voor admins). Los geladen vanuit
  // App.svelte, zodat gewone bezoekers deze code (en ajv) niet downloaden.
  import { catalog } from "../../lib/state/catalog.svelte.js";
  import { CATEGORY_LABELS } from "../../lib/domain/plantings.js";
  import PlantIcon from "../PlantIcon.svelte";
  import SpeciesEditor from "./SpeciesEditor.svelte";
  import TaskTypesEditor from "./TaskTypesEditor.svelte";

  let section = $state("soorten"); // "soorten" | "taaktypes"
  let query = $state("");
  // undefined = lijst tonen; null = nieuwe soort; object = die soort bewerken
  let editing = $state(undefined);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.speciesList;
    return catalog.speciesList.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.latin ?? "").toLowerCase().includes(q) || s.id.includes(q)
    );
  });
</script>

{#if editing !== undefined}
  {#key editing?.id ?? "nieuw"}
    <SpeciesEditor species={editing} onclose={() => (editing = undefined)} />
  {/key}
{:else}
  <div class="filter-bar admin-sections">
    <button type="button" class="filter-chip" aria-pressed={section === "soorten"} onclick={() => (section = "soorten")}>
      Soorten ({catalog.speciesList.length})
    </button>
    <button type="button" class="filter-chip" aria-pressed={section === "taaktypes"} onclick={() => (section = "taaktypes")}>
      Taaktypes
    </button>
  </div>

  {#if catalog.source !== "remote"}
    <p class="error-text">
      Let op: de plantendata komt nu niet uit de database maar uit de {catalog.source === "cache" ? "offline-kopie" : "meegebakken bestanden"}.
      Wijzigingen worden wel opgeslagen, maar controleer je verbinding.
    </p>
  {/if}

  {#if section === "soorten"}
    <div class="panel">
      <div class="admin-toolbar">
        <input type="search" placeholder="Zoek op naam, Latijnse naam of id…" aria-label="Zoek soort" bind:value={query} />
        <button type="button" class="btn btn-primary" onclick={() => (editing = null)}>+ Nieuwe soort</button>
      </div>
      <ul class="species-admin-list">
        {#each filtered as s (s.id)}
          <li>
            <button type="button" class="species-admin-row" onclick={() => (editing = s)}>
              <PlantIcon species={s} size={30} />
              <span class="species-admin-name">
                {s.name}
                {#if s.latin}<span class="species-admin-latin">{s.latin}</span>{/if}
              </span>
              <span class="hint">{CATEGORY_LABELS[s.category] ?? s.category} · {s.tasks.length} taken</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if filtered.length === 0}<p class="empty-state">Geen soorten gevonden.</p>{/if}
    </div>
  {:else}
    <TaskTypesEditor />
  {/if}
{/if}

<style>
  .admin-sections {
    margin-bottom: var(--space-4);
  }

  .admin-toolbar {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .admin-toolbar .btn {
    flex: none;
  }

  .species-admin-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .species-admin-row {
    display: grid;
    grid-template-columns: 30px 1fr auto;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) 0;
    background: none;
    border: none;
    border-bottom: 1px solid var(--color-line);
    text-align: left;
    color: var(--color-ink);
    font: inherit;
    cursor: pointer;
  }

  .species-admin-row:hover {
    background: var(--color-surface-raised);
  }

  .species-admin-name {
    display: flex;
    flex-direction: column;
  }

  .species-admin-latin {
    font-size: var(--step-1);
    font-style: italic;
    color: var(--color-ink-muted);
  }
</style>
