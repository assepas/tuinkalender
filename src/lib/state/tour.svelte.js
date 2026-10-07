// Rondleiding (Tour.svelte): open/dicht en de huidige stap. Of je hem al
// gezien hebt, onthoudt deze browser — los van het tuindocument, net als
// tuintaak:lastExportedAt in garden.js.

import { auth } from "./auth.svelte.js";
import { gardenState } from "./garden.svelte.js";

const SEEN_KEY = "tuintaak:tourSeen";

export const tour = $state({ open: false, step: 0 });

function hasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // geen opslag: liever geen rondleiding bij elk bezoek
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // niets
  }
}

export function startTour() {
  tour.step = 0;
  tour.open = true;
}

export function closeTour() {
  tour.open = false;
  markSeen();
}

/**
 * Eén keer bij opstarten: alleen voor echte nieuwkomers. Wie al planten
 * heeft, ingelogd is of via een deellink binnenkomt (dan staat het
 * inlogvenster al open), krijgt hem niet vanzelf.
 */
export function maybeAutoStart() {
  if (hasSeen() || auth.pendingInvite) return;
  let unsubscribe = null;
  let done = false;
  unsubscribe = auth.onUserChange((user) => {
    if (done) return;
    done = true;
    queueMicrotask(() => unsubscribe?.());
    if (!user && gardenState.plantings.length === 0) startTour();
  });
}
