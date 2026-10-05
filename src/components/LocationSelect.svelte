<script>
  // Kleine keuzelijst (Select.svelte) voor standplaatsen — in tegenstelling
  // tot de soortenlijst worden dit er nooit honderden, dus geen zoekveld nodig.
  // Hergebruikt in de '+'-rij én de inline-edit per planting in het
  // tuinoverzicht. Volledig "controlled": geen eigen state, de aanroeper
  // bepaalt via `value` wat er getoond wordt en via `onchange` wat er met een
  // nieuwe keuze gebeurt (bv. eerst een dubbel-check doen vóór de wijziging
  // echt wordt toegepast). "Standplaats toevoegen…" opent de standplaatsen-modal;
  // een daar toegevoegde standplaats komt via dezelfde `onchange` terug.
  import { openLocationManager } from "../lib/state/ui.svelte.js";
  import Select from "./Select.svelte";

  let { locations, value = null, id = undefined, disabled = false, onchange } = $props();

  const ADD_LOCATION = "__add__";

  const options = $derived([
    ...[...locations]
      .sort((a, b) => a.name.localeCompare(b.name, "nl"))
      .map((location) => ({ value: location.id, label: location.name })),
    { value: ADD_LOCATION, label: "+ Standplaats toevoegen…" },
  ]);

  function handleChange(newValue) {
    if (newValue === ADD_LOCATION) {
      openLocationManager((location) => onchange?.(location.id));
      return;
    }
    onchange?.(newValue || null);
  }
</script>

<Select {id} {options} value={value ?? ""} onchange={handleChange} {disabled} />
