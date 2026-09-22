<script>
  // Kleine, gewone <select> voor standplaatsen — in tegenstelling tot de
  // soortenlijst worden dit er nooit honderden, dus geen combobox nodig.
  // Hergebruikt in het "plant toevoegen"-formulier én de inline-edit per
  // planting in het tuinoverzicht. Volledig "controlled": geen eigen state,
  // de aanroeper bepaalt via `value` wat er getoond wordt en via `onchange`
  // wat er met een nieuwe keuze gebeurt (bv. eerst een dubbel-check doen
  // vóór de wijziging echt wordt toegepast).
  let { locations, value = null, id = undefined, disabled = false, onchange } = $props();

  const sorted = $derived([...locations].sort((a, b) => a.name.localeCompare(b.name, "nl")));

  function handleChange(event) {
    onchange?.(event.target.value || null);
  }
</script>

<select {id} value={value ?? ""} onchange={handleChange} {disabled}>
  <option value="">— geen standplaats —</option>
  {#each sorted as location (location.id)}
    <option value={location.id}>{location.name}</option>
  {/each}
</select>
