// Vraagt de browser om "persistent storage": data die niet automatisch
// opgeruimd wordt onder geheugendruk of na een tijdje inactiviteit. Vooral
// relevant op iOS Safari, dat localStorage van gewone (niet-geïnstalleerde)
// sites na ~7 dagen zonder bezoek kan wissen. Best-effort: de browser mag
// nee zeggen, en op iOS werkt dit alleen goed als de app als PWA vanaf het
// beginscherm draait (zie manifest.json + apple-mobile-web-app-capable in
// index.html) — vandaar ook stap 1 van de PWA-opzet.
export async function requestPersistentStorage() {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) return;

  try {
    const granted = await navigator.storage.persist();
    if (!granted) {
      console.info("[storage] persistente opslag niet toegekend door de browser.");
    }
  } catch (err) {
    console.error("[storage] kon persistente opslag niet aanvragen:", err);
  }
}
