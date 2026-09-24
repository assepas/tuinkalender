<script>
  // Compacte samenvattingsrij per planting — visueel dezelfde taal als een
  // plant-kop in de Tijdlijn (PlantIcon + naam + Latijnse naam), met de
  // standplaats direct als dropdown bewerkbaar (geen vrij tekstveld meer,
  // dus een kleine wijziging hier is laag risico). De rest (eigen naam,
  // notities, uitgeschakelde taken) staat achter een uitklapper, zodat een
  // tuin met tientallen planten overzichtelijk blijft.
  import { speciesIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import LocationSelect from "./LocationSelect.svelte";
  import PlantIcon from "./PlantIcon.svelte";

  // `autoExpand`: rij net toegevoegd via de toevoegrij — uitgeklapt, met
  // de focus op "Eigen naam". Gaat dicht zodra er een nieuwere is toegevoegd.
  let { planting, autoExpand = false } = $props();

  let expanded = $state(false);
  let labelInput = $state();

  $effect(() => {
    expanded = autoExpand;
  });

  $effect(() => {
    if (autoExpand) labelInput?.focus();
  });
  let locationError = $state("");

  const species = $derived(speciesIndex[planting.speciesId]);
  const location = $derived(gardenState.locations.find((l) => l.id === planting.locationId) ?? null);

  function isMuted(taskId) {
    return (planting.mutedTasks ?? []).includes(taskId);
  }

  function handleLocationChange(newLocationId) {
    locationError = "";
    if (newLocationId && !gardenState.canAddPlanting(planting.speciesId, newLocationId, planting.uid)) {
      const target = gardenState.locations.find((l) => l.id === newLocationId);
      locationError = `Je hebt hier al een ${species?.name ?? "plant"} op "${target?.name ?? "deze standplaats"}" staan.`;
      return;
    }
    gardenState.updatePlanting(planting.uid, { locationId: newLocationId });
  }
</script>

<li class="planting-row" class:expanded>
  <div class="planting-row-summary">
    <button
      type="button"
      class="planting-row-toggle"
      onclick={() => (expanded = !expanded)}
      aria-expanded={expanded}
      aria-label={expanded ? "Details inklappen" : "Details uitklappen"}
    >
      {expanded ? "▾" : "▸"}
    </button>
    <PlantIcon {species} size={28} />
    <span class="planting-row-names">
      <span class="plant-name">{planting.label || species?.name || "Onbekende soort"}</span>
      {#if species?.latin}<span class="plant-latin">{species.latin}</span>{/if}
    </span>

    {#if species}
      <span class="planting-row-location">
        <LocationSelect
          locations={gardenState.locations}
          value={planting.locationId}
          onchange={handleLocationChange}
        />
      </span>
    {/if}

    <button type="button" class="btn btn-danger" onclick={() => gardenState.removePlanting(planting.uid)}>
      Verwijderen
    </button>
  </div>

  {#if locationError}
    <p class="error-text">{locationError}</p>
  {/if}

  {#if !species}
    <p class="error-text">
      Onbekende soort-id "{planting.speciesId}" — mogelijk verwijderd uit de soortdata.
    </p>
  {:else if expanded}
    <div class="planting-row-detail">
      <div class="field-grid">
        <div>
          <label for={`label-${planting.uid}`}>Eigen naam</label>
          <input
            id={`label-${planting.uid}`}
            bind:this={labelInput}
            type="text"
            value={planting.label}
            onchange={(e) => gardenState.updatePlanting(planting.uid, { label: e.target.value })}
          />
        </div>
      </div>
      {#if location?.soil}
        <p class="hint">Grondsoort van "{location.name}": {location.soil}.</p>
      {/if}
      <label for={`notes-${planting.uid}`}>Notities</label>
      <textarea
        id={`notes-${planting.uid}`}
        value={planting.notes}
        onchange={(e) => gardenState.updatePlanting(planting.uid, { notes: e.target.value })}
      ></textarea>

      <div class="muted-tasks">
        {#each species.tasks as task (task.id)}
          <label>
            <input
              type="checkbox"
              checked={!isMuted(task.id)}
              onchange={() => gardenState.toggleMutedTask(planting.uid, task.id)}
            />
            {task.type}: {task.id}
          </label>
        {/each}
      </div>
      <p class="hint">Vink een taak uit als die voor deze plant niet van toepassing is.</p>
    </div>
  {/if}
</li>
