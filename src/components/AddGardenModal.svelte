<script>
  // "Nieuwe tuin toevoegen" uit de tuinkiezer: naam kiezen en waarmee je
  // begint — leeg, een back-up (.json-export), of de tuin die nog in deze
  // browser staat van vóór het inloggen.
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { importGardenFromJson } from "../lib/storage/garden.js";
  import Modal from "./Modal.svelte";

  let { onclose } = $props();

  let name = $state("");
  let source = $state("empty"); // "empty" | "backup" | "local"
  let busy = $state(false);
  let error = $state("");

  let fileInput = $state(null);
  let backupName = $state("");
  let backupData = $state(null);
  let backupError = $state("");

  const trimmed = $derived(name.trim());
  const canSubmit = $derived(!!trimmed && !busy && (source !== "backup" || !!backupData));

  // Meteen controleren bij kiezen, zodat een verkeerd bestand direct opvalt.
  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // zelfde bestand nog eens kiezen moet ook werken
    if (!file) return;
    backupName = file.name;
    backupData = null;
    backupError = "";
    try {
      backupData = importGardenFromJson(await file.text());
    } catch (err) {
      backupError = err.message;
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    error = "";
    busy = true;
    try {
      await gardenState.createCloudGarden(trimmed, {
        fromLocal: source === "local",
        data: source === "backup" ? backupData : null,
      });
      onclose();
    } catch (err) {
      error = err.message ?? String(err);
    } finally {
      busy = false;
    }
  }
</script>

<Modal title="Nieuwe tuin toevoegen" {onclose}>
  <form class="add-garden" onsubmit={submit}>
    <div>
      <label for="new-garden-name">Naam</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input id="new-garden-name" type="text" bind:value={name} placeholder="Bijv. Volkstuin of Balkon" autofocus />
    </div>

    <fieldset>
      <legend>Beginnen met</legend>
      <label class="radio-pill">
        <input type="radio" name="garden-source" value="empty" bind:group={source} />
        Een lege tuin
      </label>
      <label class="radio-pill">
        <input type="radio" name="garden-source" value="backup" bind:group={source} />
        Een back-up (.json-bestand)
      </label>
      {#if gardenState.localGardenHasPlantings}
        <label class="radio-pill">
          <input type="radio" name="garden-source" value="local" bind:group={source} />
          De tuin uit deze browser (van vóór je inlogde)
        </label>
      {/if}
    </fieldset>

    {#if source === "backup"}
      <div>
        <div class="file-row">
          <button type="button" class="btn" onclick={() => fileInput.click()}>Bestand kiezen…</button>
          <span class="file-name">{backupName || "Nog geen bestand gekozen"}</span>
        </div>
        <input type="file" accept="application/json" bind:this={fileInput} onchange={handleFile} style="display:none" />
        {#if backupError}<p class="error-text">{backupError}</p>{/if}
      </div>
    {/if}

    {#if error}<p class="error-text">{error}</p>{/if}
    <div class="btn-row">
      <button type="submit" class="btn btn-primary" disabled={!canSubmit}>
        {busy ? "Toevoegen…" : "Toevoegen"}
      </button>
    </div>
  </form>
</Modal>

<style>
  .add-garden {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  fieldset {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  legend {
    font-size: var(--step-1);
    color: var(--color-ink-muted);
    margin-bottom: var(--space-2);
    padding: 0;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .file-name {
    font-size: var(--step-1);
    color: var(--color-ink-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .error-text {
    margin: 0;
  }

  .file-row + input + .error-text {
    margin-top: var(--space-2);
  }
</style>
