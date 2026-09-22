<script>
  import { speciesIndex } from "../lib/generated/data.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import SpeciesPicker from "./SpeciesPicker.svelte";

  let importText = $state("");
  let importError = $state("");
  let fileInput;

  function isMuted(planting, taskId) {
    return (planting.mutedTasks ?? []).includes(taskId);
  }

  function exportFilename() {
    return `tuinkalender-${new Date().toISOString().slice(0, 10)}.json`;
  }

  function downloadExport(json, filename) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    gardenState.recordExport();
  }

  // Op mobiel liever het native deelvenster (Bewaar in Bestanden, AirDrop,
  // appen naar iemand) dan alleen een download — val terug op de downloadlink
  // als de browser geen bestanden kan delen.
  async function shareOrDownloadExport() {
    const json = gardenState.exportAsJson();
    const filename = exportFilename();

    if (navigator.share && navigator.canShare) {
      const file = new File([json], filename, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Tuinkalender" });
          gardenState.recordExport();
          return;
        } catch (err) {
          if (err?.name === "AbortError") return; // gebruiker annuleerde het deelvenster
          console.error("[export] delen mislukt, val terug op download:", err);
        }
      }
    }

    downloadExport(json, filename);
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      importText = text;
      applyImport();
    });
  }

  function applyImport() {
    importError = "";
    try {
      gardenState.importFromJson(importText);
      importText = "";
    } catch (err) {
      importError = err.message;
    }
  }
</script>

<SpeciesPicker />

<div class="panel">
  <h2>Planten in je tuin ({gardenState.plantings.length})</h2>
  {#if gardenState.plantings.length === 0}
    <p class="empty-state">Nog geen planten toegevoegd.</p>
  {:else}
    <ul class="planting-list">
      {#each gardenState.plantings as planting (planting.uid)}
        {@const species = speciesIndex[planting.speciesId]}
        <li class="planting-card">
          <div class="planting-card-head">
            <div>
              <h3>{planting.label || species?.name || "Onbekende soort"}</h3>
              {#if species && planting.label}
                <span class="species-name">{species.name}</span>
              {/if}
            </div>
            <button
              type="button"
              class="btn btn-danger"
              onclick={() => gardenState.removePlanting(planting.uid)}
            >
              Verwijderen
            </button>
          </div>

          {#if !species}
            <p class="error-text">
              Onbekende soort-id "{planting.speciesId}" — mogelijk verwijderd uit de soortdata.
            </p>
          {:else}
            <div class="field-grid">
              <div>
                <label for={`label-${planting.uid}`}>Eigen naam</label>
                <input
                  id={`label-${planting.uid}`}
                  type="text"
                  value={planting.label}
                  onchange={(e) => gardenState.updatePlanting(planting.uid, { label: e.target.value })}
                />
              </div>
              <div>
                <label for={`position-${planting.uid}`}>Standplaats</label>
                <input
                  id={`position-${planting.uid}`}
                  type="text"
                  value={planting.position}
                  onchange={(e) => gardenState.updatePlanting(planting.uid, { position: e.target.value })}
                />
              </div>
              <div>
                <label for={`soil-${planting.uid}`}>Grondsoort</label>
                <input
                  id={`soil-${planting.uid}`}
                  type="text"
                  value={planting.soil}
                  onchange={(e) => gardenState.updatePlanting(planting.uid, { soil: e.target.value })}
                />
              </div>
            </div>
            <label for={`notes-${planting.uid}`}>Notities</label>
            <textarea
              id={`notes-${planting.uid}`}
              value={planting.notes}
              onchange={(e) => gardenState.updatePlanting(planting.uid, { notes: e.target.value })}
            ></textarea>

            <div class="muted-tasks">
              {#each species.tasks as task (task.id)}
                <label>
                  <input
                    type="checkbox"
                    checked={!isMuted(planting, task.id)}
                    onchange={() => gardenState.toggleMutedTask(planting.uid, task.id)}
                  />
                  {task.type}: {task.id}
                </label>
              {/each}
            </div>
            <p class="hint">Vink een taak uit als die voor deze plant niet van toepassing is.</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<div class="panel">
  <h2>Back-up &amp; delen</h2>
  <p class="hint">
    Je tuin staat lokaal in deze browser. Exporteer regelmatig een back-up, en gebruik dezelfde
    export om je tuin op een ander apparaat te openen of met iemand anders te delen.
  </p>
  {#if gardenState.needsBackupWarning}
    <p class="error-text">
      {#if gardenState.lastExportedAt == null}
        Je hebt nog nooit een back-up geëxporteerd. Doe dat even, dan ben je niet afhankelijk van
        alleen deze browser.
      {:else}
        Je laatste back-up is van {new Date(gardenState.lastExportedAt).toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })} — tijd voor een nieuwe export.
      {/if}
    </p>
  {/if}
  <div class="btn-row">
    <button type="button" class="btn btn-primary" onclick={shareOrDownloadExport}>
      Tuin exporteren (.json)
    </button>
    <button type="button" class="btn" onclick={() => fileInput.click()}> Tuin importeren… </button>
    <input
      type="file"
      accept="application/json"
      bind:this={fileInput}
      onchange={handleFile}
      style="display:none"
    />
  </div>
  {#if importError}
    <p class="error-text">{importError}</p>
  {/if}
</div>
