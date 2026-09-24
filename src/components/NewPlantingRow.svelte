<script>
  // Vaste toevoegrij bovenaan het tuinoverzicht: zelfde kolommen als een
  // PlantingRow, maar met de soortenzoeker op de plek van de naam en
  // "Toevoegen" i.p.v. "Verwijderen". De nieuwe plant verschijnt (via
  // `onadded`) uitgeklapt bovenaan, om eigen naam, notities en taken in te vullen.
  import { catalog } from "../lib/state/catalog.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import SpeciesCombobox from "./SpeciesCombobox.svelte";
  import LocationSelect from "./LocationSelect.svelte";
  import PlantIcon from "./PlantIcon.svelte";

  let { onadded = null } = $props();

  let speciesId = $state(null);
  let locationId = $state(null);
  let submitError = $state("");

  const species = $derived(speciesId ? catalog.speciesIndex[speciesId] : null);
  // Zonder expliciete keuze de standaardstandplaats — ook als die intussen
  // op de standplaatsenpagina is gewijzigd.
  const effectiveLocationId = $derived(locationId ?? gardenState.defaultLocationId);

  // Live, vóór opslaan: dezelfde soort+standplaats staat al in de tuin? Die
  // combinatie is hard geblokkeerd, dus we laten dat meteen zien.
  const isDuplicate = $derived(
    speciesId ? !gardenState.canAddPlanting(speciesId, effectiveLocationId) : false
  );
  const locationName = $derived(
    gardenState.locations.find((l) => l.id === effectiveLocationId)?.name ?? ""
  );

  function reset() {
    speciesId = null;
    locationId = null;
    submitError = "";
  }

  function save(event) {
    event.preventDefault();
    submitError = "";
    if (!speciesId || isDuplicate) return;
    try {
      const uid = gardenState.addPlanting({ speciesId, locationId: effectiveLocationId });
      reset();
      onadded?.(uid);
    } catch (err) {
      submitError = err.message;
    }
  }
</script>

<li class="planting-row planting-row-new">
  <form class="planting-row-summary" onsubmit={save}>
    <span class="planting-row-toggle-spacer" aria-hidden="true"></span>
    {#if species}
      <PlantIcon {species} size={28} />
    {:else}
      <span class="planting-row-icon-placeholder" aria-hidden="true">+</span>
    {/if}
    <span class="planting-row-names">
      <SpeciesCombobox id="new-planting-species" speciesList={catalog.speciesList} bind:value={speciesId} />
    </span>
    <span class="planting-row-location">
      <LocationSelect
        locations={gardenState.locations}
        value={effectiveLocationId}
        onchange={(v) => (locationId = v)}
      />
    </span>
    <button type="submit" class="btn btn-primary" disabled={!speciesId || isDuplicate}>Toevoegen</button>
  </form>
  {#if isDuplicate}
    <p class="error-text">
      Je hebt al een {species?.name} op "{locationName}" staan — dezelfde soort kan niet twee keer
      op dezelfde standplaats.
    </p>
  {/if}
  {#if submitError}
    <p class="error-text">{submitError}</p>
  {/if}
</li>
