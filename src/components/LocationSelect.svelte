<script>
  // Kleine, gewone <select> voor standplaatsen — in tegenstelling tot de
  // soortenlijst worden dit er nooit honderden, dus geen combobox nodig.
  // Hergebruikt in de '+'-rij én de inline-edit per planting in het
  // tuinoverzicht. Volledig "controlled": geen eigen state, de aanroeper
  // bepaalt via `value` wat er getoond wordt en via `onchange` wat er met een
  // nieuwe keuze gebeurt (bv. eerst een dubbel-check doen vóór de wijziging
  // echt wordt toegepast). "Locatie toevoegen…" opent de standplaatsen-modal;
  // een daar toegevoegde standplaats komt via dezelfde `onchange` terug.
  import { openLocationManager } from "../lib/state/ui.svelte.js";

  let { locations, value = null, id = undefined, disabled = false, onchange } = $props();

  const ADD_LOCATION = "__add__";

  const sorted = $derived([...locations].sort((a, b) => a.name.localeCompare(b.name, "nl")));

  function handleChange(event) {
    if (event.target.value === ADD_LOCATION) {
      event.target.value = value ?? ""; // select terug op de huidige keuze
      openLocationManager((location) => onchange?.(location.id));
      return;
    }
    onchange?.(event.target.value || null);
  }
</script>

<select {id} value={value ?? ""} onchange={handleChange} {disabled}>
  {#each sorted as location (location.id)}
    <option value={location.id}>{location.name}</option>
  {/each}
  <option disabled>──────────</option>
  <option value={ADD_LOCATION}>Locatie toevoegen…</option>
</select>
