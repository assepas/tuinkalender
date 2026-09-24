<script>
  // Accountknop in de header + inlogvenster (magic link). Alleen zichtbaar
  // als de app met Supabase gebouwd is (auth.enabled).
  import { onMount } from "svelte";
  import { auth } from "../lib/state/auth.svelte.js";
  import { gardenState } from "../lib/state/garden.svelte.js";
  import { ui } from "../lib/state/ui.svelte.js";
  import Modal from "./Modal.svelte";

  let email = $state("");
  let sending = $state(false);
  let sentTo = $state("");
  let error = $state("");
  let inviteWaiting = $state(false);

  // Deellink geopend zonder in te loggen: meteen het inlogvenster tonen.
  onMount(() => {
    const unsubscribe = auth.onUserChange((user) => {
      if (!user && auth.pendingInvite) {
        inviteWaiting = true;
        ui.accountOpen = true;
      }
    });
    return unsubscribe;
  });

  async function sendLink(event) {
    event.preventDefault();
    error = "";
    sending = true;
    try {
      await auth.signInWithEmail(email.trim());
      sentTo = email.trim();
    } catch (err) {
      error = err.message ?? "Versturen mislukt — probeer het later opnieuw.";
    } finally {
      sending = false;
    }
  }

  async function signOut() {
    if (
      gardenState.hasUnsyncedChanges &&
      !confirm("Er zijn wijzigingen die nog niet op de server staan. Toch uitloggen? Die wijzigingen gaan dan verloren.")
    ) {
      return;
    }
    await auth.signOut();
    ui.accountOpen = false;
  }

  function close() {
    ui.accountOpen = false;
    sentTo = "";
    error = "";
  }
</script>

{#if auth.enabled}
  <button type="button" class="account-button" onclick={() => (ui.accountOpen = true)}>
    {#if auth.user}
      <span class="account-dot" class:warn={gardenState.syncStatus === "offline" || gardenState.syncStatus === "error"}></span>
      <span class="account-email">{auth.user.email}</span>
    {:else}
      Inloggen
    {/if}
  </button>
{/if}

{#if ui.accountOpen}
  <Modal title={auth.user ? "Account" : "Inloggen"} onclose={close}>
    {#if auth.user}
      <p class="modal-text">Ingelogd als <strong>{auth.user.email}</strong>.</p>
      {#if auth.isAdmin}
        <p class="hint">Je bent beheerder: je kunt de plantendata bewerken.</p>
      {/if}
      <div class="btn-row">
        <button type="button" class="btn" onclick={signOut}>Uitloggen</button>
      </div>
    {:else if sentTo}
      <p class="modal-text">
        Check je mail: we hebben een inloglink gestuurd naar <strong>{sentTo}</strong>. Klik erop op dit
        apparaat (of een ander) en je bent ingelogd.
      </p>
      <div class="btn-row">
        <button type="button" class="btn" onclick={() => (sentTo = "")}>Ander e-mailadres</button>
      </div>
    {:else}
      {#if inviteWaiting}
        <p class="modal-text">Je bent uitgenodigd voor een gedeelde tuin. Log in om mee te doen.</p>
      {/if}
      <p class="hint">
        Met een account staat je tuin veilig online, zie je hem op al je apparaten en kun je hem delen.
        Zonder account werkt de app gewoon, met je tuin alleen in deze browser.
      </p>
      <form onsubmit={sendLink}>
        <label for="login-email">E-mailadres</label>
        <input id="login-email" type="email" autocomplete="email" required bind:value={email} />
        {#if error}<p class="error-text">{error}</p>{/if}
        <div class="btn-row login-actions">
          <button type="submit" class="btn btn-primary" disabled={sending}>
            {sending ? "Versturen…" : "Stuur inloglink"}
          </button>
        </div>
      </form>
    {/if}
  </Modal>
{/if}

<style>
  .account-button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    max-width: 16rem;
    background: transparent;
    border: 1px solid var(--color-primary-muted);
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-3);
    font-size: var(--step-1);
    color: var(--color-primary-ink);
    cursor: pointer;
  }

  .account-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .account-email {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .account-dot {
    flex: none;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: var(--color-primary-muted);
  }

  .account-dot.warn {
    background: #e8c547;
  }

  .modal-text {
    margin: 0 0 var(--space-3);
  }

  .login-actions {
    margin-top: var(--space-3);
  }
</style>
