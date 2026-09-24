// Gedeelde UI-state die niet in het tuindocument hoort (niet opgeslagen).
// De standplaatsen-modal wordt vanuit elke standplaats-dropdown op "Mijn
// tuin" geopend, maar staat één keer in de pagina (GardenEditor.svelte).

export const ui = $state({
  locationManager: { open: false, onadded: null },
});

/** @param {((location: {id: string}) => void) | null} [onadded]  aangeroepen met een nieuw toegevoegde standplaats */
export function openLocationManager(onadded = null) {
  ui.locationManager = { open: true, onadded };
}

export function closeLocationManager() {
  ui.locationManager = { open: false, onadded: null };
}
