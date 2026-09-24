import { mount } from "svelte";
import App from "./App.svelte";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/print.css";
import { requestPersistentStorage } from "./lib/storage/persistence.js";
import { catalog } from "./lib/state/catalog.svelte.js";
import { auth, captureInviteFromUrl } from "./lib/state/auth.svelte.js";
import { gardenState } from "./lib/state/garden.svelte.js";

// Eén keer bij opstarten, niet bij elke render.
requestPersistentStorage();
// Actuele plantendata ophalen; tot die binnen is draait de app op de cache
// of de meegebakken versie (zie catalog.svelte.js).
catalog.refresh();

// Een deellink (?invite=…) onthouden tot je bent ingelogd, en bij elke
// wissel van gebruiker de juiste tuin laden (lokaal of uit je account).
captureInviteFromUrl();
auth.onUserChange((user) => gardenState.setUser(user));

// Alleen in productie registreren: tijdens `npm run dev` zou de service
// worker Vite's eigen module-fetches en HMR-websocket in de weg kunnen zitten.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.error("[pwa] service worker registratie mislukt:", err);
    });
  });
}

const app = mount(App, { target: document.getElementById("app") });

export default app;
