<script>
  // Tuininstellingen: naam, delen, back-up en verwijderen van de actieve
  // tuin. Zonder tuin in je account (niet ingelogd) blijft alleen de
  // back-up over, en heet het venster gewoon "Instellingen".
  import { onMount } from "svelte";
  import { auth } from "../lib/state/auth.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { createInvite, listMembers, removeMember } from "../lib/storage/cloudGarden.js";
  import Modal from "./Modal.svelte";

  let { onclose } = $props();

  const cloud = $derived(gardenState.mode === "cloud" ? gardenState.cloudGarden : null);
  const isOwner = $derived(cloud?.role === "owner");
  const isLast = $derived(gardenState.gardens.length <= 1);

  let busy = $state(false);
  let error = $state("");

  let name = $state(gardenState.cloudGarden?.name ?? "");
  let saved = $state(false);
  const trimmed = $derived(name.trim());
  const canSave = $derived(!!cloud && !!trimmed && trimmed !== cloud.name);

  let members = $state([]);
  let inviteLink = $state("");
  let copied = $state(false);

  let confirmName = $state("");

  let importError = $state("");
  let fileInput;

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

  onMount(() => {
    if (cloud) run(async () => (members = await listMembers(cloud.id)));
  });

  function saveName(event) {
    event.preventDefault();
    if (!canSave) return;
    run(async () => {
      await gardenState.renameCloudGarden(trimmed);
      saved = true;
    });
  }

  function makeInvite() {
    run(async () => {
      const token = await createInvite(cloud.id);
      const url = new URL(window.location.pathname, window.location.origin);
      url.searchParams.set("invite", token);
      inviteLink = url.toString();
      copied = false;
    });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      copied = true;
    } catch {
      // Geen klembord-toegang: de link staat geselecteerd in het veld.
    }
  }

  function kickMember(member) {
    if (!confirm(`${member.email ?? "Dit lid"} uit de tuin verwijderen?`)) return;
    run(async () => {
      await removeMember(cloud.id, member.user_id);
      members = members.filter((m) => m.user_id !== member.user_id);
    });
  }

  function deleteGarden() {
    if (confirmName !== cloud.name) return;
    run(async () => {
      await gardenState.deleteCloudGarden();
      onclose();
    });
  }

  function leaveGarden() {
    if (!confirm(`Uit "${cloud.name}" stappen? Je hebt daarna een nieuwe uitnodiging nodig.`)) return;
    run(async () => {
      await gardenState.leaveCloudGarden();
      onclose();
    });
  }

  // --- back-up ---

  function exportFilename() {
    return `tuintaak-${new Date().toISOString().slice(0, 10)}.json`;
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
          await navigator.share({ files: [file], title: "TuinTaak" });
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
    importError = "";
    file.text().then((text) => {
      try {
        gardenState.importFromJson(text);
      } catch (err) {
        importError = err.message;
      }
    });
    event.target.value = ""; // zelfde bestand nog eens kiezen moet ook werken
  }
</script>

<Modal title={cloud ? "Tuininstellingen" : "Instellingen"} onclose={onclose}>
  <div class="settings">
    {#if cloud}
      <form class="settings-section" onsubmit={saveName}>
        <h3>Naam</h3>
        <label for="garden-name" class="visually-hidden">Naam van de tuin</label>
        <input
          id="garden-name"
          type="text"
          bind:value={name}
          oninput={() => (saved = false)}
          aria-invalid={!trimmed}
        />
        {#if !trimmed}
          <p class="error-text">Geef je tuin een naam.</p>
        {:else if saved && !canSave}
          <p class="hint">Opgeslagen ✓</p>
        {/if}
        <div class="btn-row">
          <button type="submit" class="btn btn-primary" disabled={!canSave || busy}>Opslaan</button>
        </div>
      </form>

      <section class="settings-section">
        <h3>Delen</h3>
        <ul class="member-list">
          {#each members as member (member.user_id)}
            <li>
              <span>
                {member.email ?? "Onbekend"}
                {#if member.user_id === auth.user?.id}<span class="hint">(jij)</span>{/if}
                {#if member.role === "owner"}<span class="hint">— eigenaar</span>{/if}
              </span>
              {#if isOwner && member.role !== "owner"}
                <button type="button" class="btn btn-danger" disabled={busy} onclick={() => kickMember(member)}>
                  Verwijderen
                </button>
              {/if}
            </li>
          {/each}
        </ul>
        {#if isOwner}
          <p class="hint">
            Een uitnodigingslink werkt één keer en is 14 dagen geldig. Wie hem opent en inlogt, kan de tuin
            bekijken en bewerken.
          </p>
          {#if inviteLink}
            <input type="text" readonly value={inviteLink} onfocus={(e) => e.currentTarget.select()} />
            <div class="btn-row">
              <button type="button" class="btn btn-primary" onclick={copyInvite}>
                {copied ? "Gekopieerd ✓" : "Link kopiëren"}
              </button>
              <button type="button" class="btn" disabled={busy} onclick={makeInvite}>Nog een link</button>
            </div>
          {:else}
            <div class="btn-row">
              <button type="button" class="btn btn-primary" disabled={busy} onclick={makeInvite}>
                Uitnodigingslink maken
              </button>
            </div>
          {/if}
        {:else}
          <p class="hint">Alleen de eigenaar kan nieuwe mensen uitnodigen.</p>
        {/if}
      </section>
    {/if}

    <section class="settings-section">
      <h3>Back-up</h3>
      {#if cloud}
        <p class="hint">
          Je tuin staat online in je account. Een export (.json) is een extra kopie voor je eigen archief;
          importeren vervangt de inhoud van deze tuin voor alle leden.
        </p>
      {:else}
        <p class="hint">
          Je tuin staat lokaal in deze browser. Exporteer regelmatig een back-up, en gebruik dezelfde
          export om je tuin op een ander apparaat te openen of met iemand anders te delen.
        </p>
      {/if}
      {#if gardenState.needsBackupWarning}
        <p class="error-text">
          {#if gardenState.lastExportedAt == null}
            Je hebt nog nooit een back-up geëxporteerd. Doe dat nu, dan ben je niet afhankelijk van
            de data die deze browser onthoudt.
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
        <button type="button" class="btn" onclick={() => fileInput.click()}>Tuin importeren…</button>
        <input
          type="file"
          accept="application/json"
          bind:this={fileInput}
          onchange={handleFile}
          style="display:none"
        />
      </div>
      {#if importError}<p class="error-text">{importError}</p>{/if}
    </section>

    {#if cloud}
      {#if isOwner}
        <section class="settings-section">
          <h3 class="danger">Verwijderen</h3>
          {#if isLast}
            <p class="hint"><em>Dit is je enige tuin. Voeg eerst een andere tuin toe voordat je deze verwijdert.</em></p>
          {:else}
            <p class="hint">
              Alle planten, standplaatsen en taken van deze tuin verdwijnen, ook voor de leden met wie je hem
              deelt. Dit kun je niet ongedaan maken. Typ <strong class="confirm-name">{cloud.name}</strong> om te
              bevestigen.
            </p>
            <label for="garden-delete-confirm" class="visually-hidden">Naam van de tuin ter bevestiging</label>
            <input id="garden-delete-confirm" type="text" bind:value={confirmName} placeholder={cloud.name} />
            <div class="btn-row">
              <button
                type="button"
                class="btn btn-danger"
                disabled={confirmName !== cloud.name || busy}
                onclick={deleteGarden}
              >
                Tuin verwijderen
              </button>
            </div>
          {/if}
        </section>
      {:else}
        <!-- Leden die geen eigenaar zijn kunnen de tuin niet verwijderen (RLS), wel verlaten. -->
        <section class="settings-section">
          <h3 class="danger">Tuin verlaten</h3>
          <p class="hint">Je verdwijnt uit deze gedeelde tuin. Om weer mee te doen heb je een nieuwe uitnodiging nodig.</p>
          <div class="btn-row">
            <button type="button" class="btn btn-danger" disabled={busy} onclick={leaveGarden}>Tuin verlaten</button>
          </div>
        </section>
      {/if}
    {/if}

    {#if error}<p class="error-text">{error}</p>{/if}
  </div>
</Modal>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .settings-section + .settings-section {
    border-top: var(--border);
    padding-top: var(--space-4);
  }

  .settings-section h3 {
    font-family: var(--font-display);
    font-weight: var(--weight-display);
    font-size: var(--step1);
    margin: 0 0 var(--space-2);
  }

  .settings-section h3.danger {
    color: var(--color-danger);
  }

  .settings-section p {
    margin: 0;
  }

  .confirm-name {
    color: var(--color-ink);
  }

  .member-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-size: var(--step-1);
  }

  .member-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
