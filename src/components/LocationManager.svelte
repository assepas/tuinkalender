<script>
  // Standplaatsen zijn een puur tuin-eigen concept (net als plantingen) —
  // geen gedeelde soortdata, want iedere tuinier noemt zijn plekken anders.
  // Alleen inhoud, geen paneel eromheen: staat zowel op de eigen pagina
  // (LocationsPage.svelte) als in een modal op "Mijn tuin" (GardenEditor.svelte).
  // `idPrefix` houdt de id's uniek als beide ooit tegelijk in de DOM staan.
  import { gardenState } from "../lib/state/garden.svelte.js";
  import {
    LOCATION_KIND_LABELS,
    SUN_ORDER,
    SUN_LABELS,
    SOIL_ORDER,
    SOIL_LABELS,
    MOISTURE_ORDER,
    MOISTURE_LABELS,
    normalizeSoil,
  } from "../lib/domain/plantings.js";
  import Select from "./Select.svelte";

  let { idPrefix = "loc", onadded = null } = $props();

  let name = $state("");
  let kind = $state("");
  let soil = $state("");
  let sun = $state("");
  let moisture = $state("");
  let addError = $state("");
  let removeError = $state("");

  // In deze sessie toegevoegde standplaatsen (nieuwste eerst) staan bovenaan,
  // net als nieuwe planten op "Mijn tuin". Niet opgeslagen.
  let addedIds = $state([]);

  const kindOptions = [
    { value: "", label: "— geen —" },
    ...Object.entries(LOCATION_KIND_LABELS).map(([value, label]) => ({ value, label })),
  ];

  // Licht, grond en vocht: dezelfde vaste waarden als bij de soorten, zodat
  // Uitgebreid zoeken planten kan vinden die op deze plek passen. Op smalle
  // schermen (zonder kolomkop) zet app.css er een klein bijschrift boven.
  const enumOptions = (order, labels, empty) => [
    { value: "", label: empty },
    ...order.map((value) => ({ value, label: labels[value] })),
  ];
  const sunOptions = enumOptions(SUN_ORDER, SUN_LABELS, "—");
  const moistureOptions = enumOptions(MOISTURE_ORDER, MOISTURE_LABELS, "—");
  const baseSoilOptions = enumOptions(SOIL_ORDER, SOIL_LABELS, "—");

  // Oude standplaatsen kunnen vrije tekst als grondsoort hebben. Herkennen we
  // die niet, dan blijft hij als extra optie staan i.p.v. stil te verdwijnen.
  function soilOptions(location) {
    const legacy = location?.soil && !normalizeSoil(location.soil) ? location.soil : null;
    return legacy ? [...baseSoilOptions, { value: legacy, label: legacy }] : baseSoilOptions;
  }

  const soilValue = (location) => normalizeSoil(location.soil) ?? location.soil ?? "";

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
      const location = gardenState.addLocation({
        name,
        kind: kind || null,
        soil,
        sun: sun || null,
        moisture: moisture || null,
      });
      name = "";
      kind = "";
      soil = "";
      sun = "";
      moisture = "";
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
  kas) reageren daarop. Licht, grond en vocht zijn optioneel; vul je ze in, dan vindt
  <strong>Uitgebreid zoeken</strong> planten die op die plek passen. Nieuwe planten
  komen op de <strong>standaard</strong>-standplaats, net als planten van een standplaats die je
  verwijdert.
</p>

<div class="location-manager">
<div class="location-table-head" aria-hidden="true">
  <span>Naam</span>
  <span>Soort plek</span>
  <span>Licht</span>
  <span>Grond</span>
  <span>Vocht</span>
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
      <Select
        class="location-kind"
        id={`${idPrefix}-location-kind`}
        aria-label="Soort plek"
        options={kindOptions}
        bind:value={kind}
      />
      <Select class="location-sun" aria-label="Licht" options={sunOptions} bind:value={sun} />
      <Select
        class="location-soil"
        id={`${idPrefix}-location-soil`}
        aria-label="Grond"
        options={baseSoilOptions}
        bind:value={soil}
      />
      <Select class="location-moisture" aria-label="Vocht" options={moistureOptions} bind:value={moisture} />
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
      <Select
        class="location-kind"
        aria-label="Soort plek"
        options={kindOptions}
        value={location.kind ?? ""}
        onchange={(value) => gardenState.updateLocation(location.id, { kind: value || null })}
      />
      <Select
        class="location-sun"
        aria-label="Licht"
        options={sunOptions}
        value={location.sun ?? ""}
        onchange={(value) => gardenState.updateLocation(location.id, { sun: value || undefined })}
      />
      <Select
        class="location-soil"
        aria-label="Grond"
        options={soilOptions(location)}
        value={soilValue(location)}
        onchange={(value) => gardenState.updateLocation(location.id, { soil: value || undefined })}
      />
      <Select
        class="location-moisture"
        aria-label="Vocht"
        options={moistureOptions}
        value={location.moisture ?? ""}
        onchange={(value) => gardenState.updateLocation(location.id, { moisture: value || undefined })}
      />
      <span class="location-count">{plantCountLabel(plantCounts[location.id])}</span>
      <label class="radio-pill">
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
