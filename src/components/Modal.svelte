<script>
  // Generieke modal-schil: overlay, paneel, sluitknop, Escape en klik-naast-
  // het-paneel. De inhoud komt als children-snippet binnen. `title` is
  // optioneel: zonder titel (bv. DetailModal, die een eigen kop met icoon
  // heeft) is `label` alleen voor schermlezers.
  let { title = "", label = title, wide = false, onclose, children } = $props();

  function handleKeydown(event) {
    if (event.key === "Escape") onclose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay no-print" role="presentation" onclick={onclose}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="modal-panel"
    class:wide
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
  >
    <button type="button" class="modal-close" onclick={onclose} aria-label="Sluiten">✕</button>
    {#if title}<h2 class="modal-title">{title}</h2>{/if}
    {@render children()}
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(35, 42, 30, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    z-index: 100;
  }

  .modal-panel {
    position: relative;
    background: var(--color-surface-raised);
    border: var(--border);
    border-radius: var(--radius);
    padding: var(--space-5);
    max-width: 26rem;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }

  .modal-panel.wide {
    max-width: 68rem;
  }

  .modal-close {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    background: transparent;
    border: none;
    font-size: 1rem;
    line-height: 1;
    color: var(--color-ink-muted);
    cursor: pointer;
    padding: var(--space-1);
  }

  .modal-title {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--step2);
    margin: 0 0 var(--space-3);
    padding-right: var(--space-5);
  }
</style>
