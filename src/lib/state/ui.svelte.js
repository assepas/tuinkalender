// Gedeelde UI-state die niet in het tuindocument hoort (niet opgeslagen).
// De standplaatsen-modal wordt vanuit elke standplaats-dropdown op "Mijn
// tuin" geopend, maar staat één keer in de pagina (GardenEditor.svelte).

export const ui = $state({
  locationManager: { open: false, onadded: null },
  // Het account-/inlogvenster (AccountMenu.svelte) staat één keer in de
  // header, maar is ook vanuit "Mijn tuin" te openen.
  accountOpen: false,
  // Tuininstellingen (GardenSettingsModal.svelte): te openen vanuit de
  // tuinkiezer in de header en vanaf "Mijn tuin".
  gardenSettingsOpen: false,
  // Mobiele weergave (kopbalk + onderbalk i.p.v. de desktop-header). Zelfde
  // grens als de @media (max-width: 34rem) in app.css.
  isMobile: false,
});

if (typeof window !== "undefined" && window.matchMedia) {
  const mobileQuery = window.matchMedia("(max-width: 34rem)");
  ui.isMobile = mobileQuery.matches;
  mobileQuery.addEventListener("change", (e) => (ui.isMobile = e.matches));
}

/** @param {((location: {id: string}) => void) | null} [onadded]  aangeroepen met een nieuw toegevoegde standplaats */
export function openLocationManager(onadded = null) {
  ui.locationManager = { open: true, onadded };
}

export function closeLocationManager() {
  ui.locationManager = { open: false, onadded: null };
}
