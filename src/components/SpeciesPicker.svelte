<script>
  import { speciesList } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import SpeciesCombobox from "./SpeciesCombobox.svelte";
  import LocationSelect from "./LocationSelect.svelte";

  let speciesId = $state(null);
  let label = $state("");
  let locationId = $state(null);
  let submitError = $state("");
  let expanded = $state(false);

  // Live, vóór submit: dezelfde soort+standplaats staat al in de tuin? De
  // combinatie is hard geblokkeerd (bewuste keuze), dus we laten dat al
  // zien terwijl je nog aan het kiezen bent, niet pas na een mislukte klik.
  const isDuplicate = $derived(
    speciesId && locationId ? !gardenState.canAddPlanting(speciesId, locationId) : false
  );
  const duplicateSpeciesName = $derived(speciesList.find((s) => s.id === speciesId)?.name ?? "");
  const duplicateLocationName = $derived(gardenState.locations.find((l) => l.id === locationId)?.name ?? "");

  function submit(event) {
    event.preventDefault();
    submitError = "";
    if (!speciesId) return;
    try {
      gardenState.addPlanting({ speciesId, label, locationId });
      speciesId = null;
      label = "";
      locationId = null;
    } catch (err) {
      submitError = err.message;
    }
  }
</script>

<form class="panel" onsubmit={submit}>
  <h2>
    <button
      type="button"
      class="panel-toggle"
      onclick={() => (expanded = !expanded)}
      aria-expanded={expanded}
      aria-controls="add-plant-body"
    >
      Plant toevoegen
      <span class="chevron">{expanded ? "▾" : "▸"}</span>
    </button>
  </h2>

  {#if expanded}
    <div id="add-plant-body">
      <div class="field-grid">
        <div>
          <label for="species-select">Soort</label>
          <SpeciesCombobox id="species-select" {speciesList} bind:value={speciesId} />
        </div>
        <div>
          <label for="label-input">Eigen naam (optioneel)</label>
          <input id="label-input" type="text" placeholder="bv. Tomaten achterin" bind:value={label} />
        </div>
        <div>
          <label for="location-select">Standplaats (optioneel)</label>
          <LocationSelect
            id="location-select"
            locations={gardenState.locations}
            value={locationId}
            onchange={(v) => (locationId = v)}
          />
        </div>
      </div>
      {#if isDuplicate}
        <p class="error-text">
          Je hebt hier al een {duplicateSpeciesName} op "{duplicateLocationName}" staan — dezelfde
          soort kan niet twee keer op dezelfde standplaats.
        </p>
      {/if}
      <button type="submit" class="btn btn-primary" disabled={isDuplicate}>Toevoegen aan tuin</button>
      {#if submitError}
        <p class="error-text">{submitError}</p>
      {/if}
      <p class="hint">
        Nog geen standplaats voor deze plant? Laat het veld leeg, of maak er hierboven eerst een aan
        bij "Standplaatsen".
      </p>
    </div>
  {/if}
</form>
