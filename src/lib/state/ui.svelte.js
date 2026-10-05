// Gedeelde UI-state die niet in het tuindocument hoort (niet opgeslagen).
// De standplaatsen-modal wordt vanuit elke standplaats-dropdown op "Mijn
// tuin" geopend, maar staat één keer in de pagina (GardenEditor.svelte).

export const ui = $state({
  // Actieve weergave (App.svelte). Hier i.p.v. lokaal in App, zodat ook
  // componenten dieper in de boom kunnen navigeren (zie requestNewSpecies).
  activeTab: "tijdlijn",
  // Admin maakt vanuit de soortenzoeker op Planten een nieuwe soort aan:
  // Plantendata opent dan meteen het formulier met deze naam ingevuld…
  newSpeciesRequest: null,
  // …en na afloop staat de nieuwe soort klaar in de toevoegrij op Planten.
  pendingSpeciesId: null,
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

/** Naar Plantendata, met het formulier voor een nieuwe soort open. */
export function requestNewSpecies(name) {
  ui.newSpeciesRequest = { name };
  ui.activeTab = "beheer";
}

/** Terug naar Planten; met een speciesId staat die soort klaar om toe te voegen. */
export function returnToGarden(speciesId = null) {
  ui.pendingSpeciesId = speciesId;
  ui.activeTab = "tuin";
}
