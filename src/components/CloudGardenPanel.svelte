<script>
  // "Opslaan & delen" bovenaan Mijn tuin: waar staat je tuin (lokaal of in
  // je account), wisselen tussen tuinen, en delen met mede-tuiniers.
  import { auth } from "../lib/state/auth.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { ui } from "../lib/state/ui.svelte.js";
  import { createInvite, listMembers, removeMember } from "../lib/storage/cloudGarden.js";
  import Modal from "./Modal.svelte";

  let busy = $state(false);
  let error = $state("");

  let shareOpen = $state(false);
  let inviteLink = $state("");
  let copied = $state(false);
  let members = $state([]);

  const cloud = $derived(gardenState.cloudGarden);
  const isOwner = $derived(cloud?.role === "owner");

  const statusText = $derived(
    {
      idle: "Opgeslagen",
      saving: "Opslaan…",
      offline: "Offline — wordt gesynchroniseerd zodra je weer verbinding hebt",
      error: "Synchroniseren mislukt",
    }[gardenState.syncStatus]
  );

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

  function rename() {
    const name = prompt("Nieuwe naam voor deze tuin:", cloud.name);
    if (name === null) return;
    run(() => gardenState.renameCloudGarden(name));
  }

  function deleteGarden() {
    if (!confirm(`"${cloud.name}" voor iedereen verwijderen? Dit kan niet ongedaan worden.`)) return;
    run(() => gardenState.deleteCloudGarden());
  }

  function leaveGarden() {
    if (!confirm(`Uit "${cloud.name}" stappen? Je hebt daarna een nieuwe uitnodiging nodig.`)) return;
    run(() => gardenState.leaveCloudGarden());
  }

  async function openShare() {
    shareOpen = true;
    inviteLink = "";
    copied = false;
    await run(async () => {
      members = await listMembers(cloud.id);
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
</script>

{#if auth.enabled}
  <div class="panel cloud-panel">
    <h2>Opslaan &amp; delen</h2>

    {#if gardenState.notice}
      <p class="cloud-notice">
        {gardenState.notice}
        <button type="button" class="filter-clear" aria-label="Melding sluiten" onclick={() => gardenState.dismissNotice()}>✕</button>
      </p>
    {/if}

    {#if !auth.user}
      <p class="hint">
        Je tuin staat nu alleen in deze browser. Log in om hem online te bewaren, op al je apparaten te
        gebruiken en te delen met mede-tuiniers.
      </p>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" onclick={() => (ui.accountOpen = true)}>Inloggen</button>
      </div>
    {:else if gardenState.mode === "local"}
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
    {:else}
      <div class="cloud-row">
        {#if gardenState.gardens.length > 1}
          <label class="cloud-select">
            <span class="visually-hidden">Tuin</span>
            <select
              value={cloud.id}
              disabled={busy}
              onchange={(e) => run(() => gardenState.selectGarden(e.currentTarget.value))}
            >
              {#each gardenState.gardens as g (g.id)}
                <option value={g.id}>{g.name}{g.role === "owner" ? "" : " (gedeeld)"}</option>
              {/each}
            </select>
          </label>
        {:else}
          <strong class="cloud-name">{cloud.name}</strong>
        {/if}
        <span class="cloud-status" class:warn={gardenState.syncStatus === "offline" || gardenState.syncStatus === "error"}>
          {statusText}
        </span>
        {#if gardenState.syncStatus === "error"}
          <button type="button" class="btn" onclick={() => gardenState.retrySync()}>Opnieuw proberen</button>
        {/if}
      </div>
      {#if gardenState.syncStatus === "error" && gardenState.syncError}
        <p class="error-text">{gardenState.syncError}</p>
      {/if}

      <div class="btn-row">
        <button type="button" class="btn btn-primary" disabled={busy} onclick={openShare}>Delen…</button>
        <button type="button" class="btn" disabled={busy} onclick={rename}>Naam wijzigen</button>
        <button type="button" class="btn" disabled={busy} onclick={newGarden}>Nieuwe tuin</button>
        {#if gardenState.localGardenHasPlantings}
          <button type="button" class="btn" disabled={busy} onclick={uploadLocal}>Lokale tuin toevoegen</button>
        {/if}
        {#if isOwner}
          <button type="button" class="btn btn-danger" disabled={busy} onclick={deleteGarden}>Tuin verwijderen</button>
        {:else}
          <button type="button" class="btn btn-danger" disabled={busy} onclick={leaveGarden}>Tuin verlaten</button>
        {/if}
      </div>
    {/if}

    {#if error}<p class="error-text">{error}</p>{/if}
  </div>
{/if}

{#if shareOpen && cloud}
  <Modal title={`"${cloud.name}" delen`} onclose={() => (shareOpen = false)}>
    <h3 class="share-heading">Leden</h3>
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
      <h3 class="share-heading">Iemand uitnodigen</h3>
      <p class="hint">
        Een uitnodigingslink werkt één keer en is 14 dagen geldig. Wie hem opent en inlogt, kan de tuin
        bekijken en bewerken.
      </p>
      {#if inviteLink}
        <input type="text" readonly value={inviteLink} onfocus={(e) => e.currentTarget.select()} />
        <div class="btn-row share-actions">
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
    {#if error}<p class="error-text">{error}</p>{/if}
  </Modal>
{/if}

<style>
  .cloud-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .cloud-select {
    margin: 0;
  }

  .cloud-select select {
    width: auto;
    min-width: 12rem;
  }

  .cloud-name {
    font-size: var(--step1);
  }

  .cloud-status {
    font-size: var(--step-1);
    color: var(--color-ink-muted);
  }

  .cloud-status.warn {
    color: var(--color-danger);
  }

  .cloud-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: var(--border);
    border-radius: var(--radius);
    background: var(--color-surface-raised);
    margin: 0 0 var(--space-3);
  }

  .share-heading {
    margin-top: var(--space-3);
  }

  .member-list {
    list-style: none;
    margin: 0 0 var(--space-3);
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .member-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .share-actions {
    margin-top: var(--space-2);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
</style>
