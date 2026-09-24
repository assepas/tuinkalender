<script>
  // Standplaatsen zijn een puur tuin-eigen concept (net als plantingen) —
  // geen gedeelde soortdata, want iedere tuinier noemt zijn plekken anders.
  // Alleen inhoud, geen paneel eromheen: staat zowel op de eigen pagina
  // (LocationsPage.svelte) als in een modal op "Mijn tuin" (GardenEditor.svelte).
  // `idPrefix` houdt de id's uniek als beide ooit tegelijk in de DOM staan.
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { LOCATION_KIND_LABELS } from "../lib/domain/plantings.js";

  let { idPrefix = "loc", onadded = null } = $props();

  let name = $state("");
  let kind = $state("");
  let soil = $state("");
  let addError = $state("");
  let removeError = $state("");

  // In deze sessie toegevoegde standplaatsen (nieuwste eerst) staan bovenaan,
  // net als nieuwe planten op "Mijn tuin". Niet opgeslagen.
  let addedIds = $state([]);

  const plantCounts = $derived.by(() => {
    const counts = {};
    for (const p of gardenState.plantings) counts[p.locationId] = (counts[p.locationId] ?? 0) + 1;
    return counts;
  });

  function plantCountLabel(count = 0) {
    if (count === 0) return "geen planten";
    return count === 1 ? "1 plant" : `${count} planten`;
  }

  const orderedLocations = $derived.by(() => {
    const byId = new Map(gardenState.locations.map((l) => [l.id, l]));
    const pinned = addedIds.map((id) => byId.get(id)).filter(Boolean);
    const pinnedIds = new Set(addedIds);
    return [...pinned, ...gardenState.locations.filter((l) => !pinnedIds.has(l.id))];
  });

  function submit(event) {
    event.preventDefault();
    addError = "";
    try {
      const location = gardenState.addLocation({ name, kind: kind || null, soil });
      name = "";
      kind = "";
      soil = "";
      addedIds = [location.id, ...addedIds];
      onadded?.(location);
    } catch (err) {
      addError = err.message;
    }
  }

  function remove(id) {
    removeError = "";
    try {
      gardenState.removeLocation(id);
    } catch (err) {
      removeError = err.message;
    }
  }
</script>

<p class="hint">
  De plekken in jouw tuin (bv. "Kas", "Border noord"). Kies je "soort plek" alleen als het
  letterlijk een kas, volle grond of een pot is — sommige taken (zoals opbinden bij tomaat in de
  kas) reageren daarop. Grondsoort is optioneel en geldt voor de hele standplaats. Nieuwe planten
  komen op de <strong>standaard</strong>-standplaats, net als planten van een standplaats die je
  verwijdert.
</p>

<div class="location-manager">
<div class="location-table-head" aria-hidden="true">
  <span>Naam</span>
  <span>Soort plek</span>
  <span>Grondsoort</span>
  <span>Planten</span>
</div>

<ul class="location-list">
  <!-- Vaste toevoegregel in dezelfde kolommen als de standplaatsen eronder. -->
  <li>
    <form class="location-row location-row-new" onsubmit={submit}>
      <input
        class="location-name"
        id={`${idPrefix}-location-name`}
        type="text"
        aria-label="Naam nieuwe standplaats"
        placeholder="Nieuwe standplaats, bv. Kas"
        bind:value={name}
      />
      <select
        class="location-kind"
        id={`${idPrefix}-location-kind`}
        aria-label="Soort plek"
        bind:value={kind}
      >
        <option value="">— geen —</option>
        {#each Object.entries(LOCATION_KIND_LABELS) as [value, label] (value)}
          <option {value}>{label}</option>
        {/each}
      </select>
      <input
        class="location-soil"
        id={`${idPrefix}-location-soil`}
        type="text"
        aria-label="Grondsoort"
        placeholder="grondsoort (optioneel)"
        bind:value={soil}
      />
      <button type="submit" class="btn btn-primary" disabled={!name.trim()}>Toevoegen</button>
    </form>
    {#if addError}
      <p class="error-text">{addError}</p>
    {/if}
  </li>
  {#each orderedLocations as location (location.id)}
    {@const isDefault = location.id === gardenState.defaultLocationId}
    <li class="location-row">
      <input
        class="location-name"
        type="text"
        value={location.name}
        aria-label="Naam"
        onchange={(e) => gardenState.updateLocation(location.id, { name: e.target.value })}
      />
      <select
        class="location-kind"
        value={location.kind ?? ""}
        aria-label="Soort plek"
        onchange={(e) => gardenState.updateLocation(location.id, { kind: e.target.value || null })}
      >
        <option value="">— geen —</option>
        {#each Object.entries(LOCATION_KIND_LABELS) as [value, label] (value)}
          <option {value}>{label}</option>
        {/each}
      </select>
      <input
        class="location-soil"
        type="text"
        value={location.soil ?? ""}
        aria-label="Grondsoort"
        placeholder="grondsoort"
        onchange={(e) => gardenState.updateLocation(location.id, { soil: e.target.value })}
      />
      <span class="location-count">{plantCountLabel(plantCounts[location.id])}</span>
      <label class="default-radio">
        <input
          type="radio"
          name={`${idPrefix}-default-location`}
          checked={isDefault}
          onchange={() => gardenState.setDefaultLocation(location.id)}
        />
        standaard
      </label>
      <button
        type="button"
        class="btn btn-danger"
        class:invisible={isDefault}
        disabled={isDefault}
        aria-hidden={isDefault}
        onclick={() => remove(location.id)}
      >
        Verwijderen
      </button>
    </li>
  {/each}
</ul>
{#if removeError}
  <p class="error-text">{removeError}</p>
{/if}
</div>
