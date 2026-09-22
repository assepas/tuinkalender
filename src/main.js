import { mount } from "svelte";
import App from "./App.svelte";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/print.css";
import { requestPersistentStorage } from "./lib/storage/persistence.js";

// Eén keer bij opstarten, niet bij elke render.
requestPersistentStorage();

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
