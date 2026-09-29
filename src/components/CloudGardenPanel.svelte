<script>
  // Bovenaan Mijn tuin, alleen als je ingelogd bent maar nog geen tuin in je
  // account hebt: de tuin uit deze browser uploaden, of leeg beginnen.
  // Zodra er een tuin is, loopt alles via de tuinkiezer in de header en
  // Tuininstellingen (GardenSettingsModal.svelte).
  import { auth } from "../lib/state/auth.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";

  let busy = $state(false);
  let error = $state("");

  /** Voert een actie uit met busy-stand en een leesbare foutmelding. */
  async function run(action) {
    error = "";
    busy = true;
    try {
      await action();
    } catch (err) {
      error = err.message ?? String(err);
    } finally {
      busy = false;
    }
  }

  function newGarden() {
    const name = prompt("Naam van de nieuwe tuin:", "Mijn tuin");
    if (name === null) return;
    run(() => gardenState.createCloudGarden(name));
  }

  function uploadLocal() {
    const name = prompt("Onder welke naam wil je deze tuin bewaren?", "Mijn tuin");
    if (name === null) return;
    run(() => gardenState.createCloudGarden(name, { fromLocal: true }));
  }
</script>

{#if auth.user && gardenState.mode === "local"}
  <div class="panel">
    <h2>Tuin in je account</h2>
    {#if gardenState.loadingCloud}
      <p class="hint">Je tuinen worden geladen…</p>
    {:else}
      <p class="hint">
        Je hebt nog geen tuin in je account. Zet de tuin uit deze browser erin, of begin met een lege tuin.
      </p>
      <div class="btn-row">
        {#if gardenState.localGardenHasPlantings}
          <button type="button" class="btn btn-primary" disabled={busy} onclick={uploadLocal}>
            Deze tuin naar mijn account
          </button>
        {/if}
        <button type="button" class="btn" disabled={busy} onclick={newGarden}>Nieuwe lege tuin</button>
      </div>
    {/if}
    {#if error}<p class="error-text">{error}</p>{/if}
  </div>
{/if}
