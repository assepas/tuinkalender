<script>
  // Rondleiding voor nieuwe bezoekers: licht één voor één echte knoppen uit
  // (via data-tour-attributen, zie tourSteps.js) met een tekstballon erbij.
  // Een doorzichtige laag vangt alle klikken, zodat je tijdens de rondleiding
  // niet per ongeluk iets aanklikt; de "spotlight" is een kader met een
  // enorme box-shadow die de rest van het scherm verduistert.
  import { tick, untrack } from "svelte";
  import { auth } from "../lib/state/auth.svelte.js";
  import { tour, closeTour } from "../lib/state/tour.svelte.js";
  import { ui } from "../lib/state/ui.svelte.js";
  import { tourSteps } from "../lib/tourSteps.js";

  const EDGE = 16; // minimale afstand tot de schermrand
  const GAP = 12; // tussen spotlight en ballon
  const PAD = 6; // ruimte rond het uitgelichte element

  const steps = $derived(
    tourSteps({ isMobile: ui.isMobile, helpInMenu: ui.isMobile && auth.enabled }).filter(
      (s) => s.target !== "account" || auth.enabled
    )
  );
  const step = $derived(steps[tour.step]);
  const isLast = $derived(tour.step === steps.length - 1);

  let target = null;
  let rect = $state(null);
  let ready = $state(false);
  let direction = 1;
  let popWidth = $state(0);
  let popHeight = $state(0);
  let viewport = $state({ w: window.innerWidth, h: window.innerHeight });
  let nextButton = $state();

  function findTarget(name) {
    for (const el of document.querySelectorAll(`[data-tour~="${name}"]`)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
    return null;
  }

  function measure() {
    viewport = { w: window.innerWidth, h: window.innerHeight };
    rect = target ? target.getBoundingClientRect() : null;
  }

  async function show(index) {
    ready = false;
    const s = steps[index];
    if (!s) return;
    if (s.tab && ui.activeTab !== s.tab) {
      ui.activeTab = s.tab;
      await tick();
    }
    target = s.target ? findTarget(s.target) : null;
    if (s.target && !target) {
      // Niet op dit scherm (of niet in deze build): overslaan.
      const next = index + direction;
      if (next >= 0 && next < steps.length) tour.step = next;
      else closeTour();
      return;
    }
    if (target) {
      const r = target.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        target.scrollIntoView({ block: "center" });
      }
    }
    measure();
    ready = true;
    await tick();
    nextButton?.focus({ preventScroll: true });
  }

  // Alleen op de stap reageren; wat show() verder leest of schakelt
  // (weergave, ready) mag de effect niet opnieuw laten lopen.
  $effect(() => {
    const index = tour.step;
    untrack(() => show(index));
  });

  function go(delta) {
    const next = tour.step + delta;
    if (next < 0) return;
    if (next >= steps.length) return finish();
    direction = delta;
    tour.step = next;
  }

  function finish() {
    if (step?.finish?.tab) ui.activeTab = step.finish.tab;
    closeTour();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") closeTour();
    else if (event.key === "ArrowRight") go(1);
    else if (event.key === "ArrowLeft") go(-1);
  }

  // Kader rond het element, binnen het scherm gehouden (bv. de buitenste
  // tab in de mobiele onderbalk).
  const spot = $derived.by(() => {
    if (!rect) return null;
    const left = Math.max(2, rect.left - PAD);
    const top = Math.max(2, rect.top - PAD);
    const right = Math.min(viewport.w - 2, rect.right + PAD);
    const bottom = Math.min(viewport.h - 2, rect.bottom + PAD);
    return { top, left, width: right - left, height: bottom - top };
  });

  // Ballon onder of boven de spotlight (waar de meeste ruimte is), horizontaal
  // gecentreerd op het element maar binnen de schermranden.
  const popStyle = $derived.by(() => {
    if (!spot) return "";
    const below = viewport.h - (spot.top + spot.height);
    const above = spot.top;
    const top =
      below >= popHeight + GAP + EDGE || below >= above
        ? spot.top + spot.height + GAP
        : spot.top - GAP - popHeight;
    const maxLeft = viewport.w - popWidth - EDGE;
    const left = Math.max(EDGE, Math.min(spot.left + spot.width / 2 - popWidth / 2, maxLeft));
    return `top: ${Math.max(EDGE, top)}px; left: ${left}px;`;
  });
</script>

<svelte:window onkeydown={handleKeydown} onresize={measure} onscroll={measure} />

<div class="tour-layer no-print" class:dim={ready && !spot} role="presentation">
  {#if ready && spot}
    <div
      class="tour-spot"
      style:top="{spot.top}px"
      style:left="{spot.left}px"
      style:width="{spot.width}px"
      style:height="{spot.height}px"
    ></div>
  {/if}

  {#if step}
    <div
      class="tour-pop"
      class:centered={!spot}
      class:hidden={!ready}
      style={popStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      bind:clientWidth={popWidth}
      bind:clientHeight={popHeight}
    >
      <div aria-live="polite">
        <h2 id="tour-title" class="tour-title">{step.title}</h2>
        <p class="tour-text">{step.text}</p>
      </div>
      <div class="tour-footer">
        <span class="tour-count">{tour.step + 1} van {steps.length}</span>
        <div class="tour-buttons">
          {#if !isLast}
            <button type="button" class="btn-link" onclick={closeTour}>Overslaan</button>
          {/if}
          {#if tour.step > 0}
            <button type="button" class="btn" onclick={() => go(-1)}>Vorige</button>
          {/if}
          <button type="button" class="btn btn-primary" bind:this={nextButton} onclick={() => go(1)}>
            {isLast ? (step.finish?.label ?? "Klaar") : "Volgende"}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .tour-layer {
    position: fixed;
    inset: 0;
    z-index: 110; /* boven .modal-overlay (100) */
  }

  .tour-layer.dim {
    background: rgba(35, 42, 30, 0.55);
  }

  .tour-spot {
    position: fixed;
    border-radius: var(--radius);
    box-shadow:
      0 0 0 2px var(--color-primary-muted),
      0 0 0 9999px rgba(35, 42, 30, 0.55);
    pointer-events: none;
    transition:
      top 0.2s ease,
      left 0.2s ease,
      width 0.2s ease,
      height 0.2s ease;
  }

  .tour-pop {
    position: fixed;
    width: min(20rem, calc(100vw - 32px));
    background: var(--color-surface-raised);
    border: var(--border);
    border-radius: var(--radius);
    padding: var(--space-4);
    box-shadow: 0 8px 24px rgba(35, 42, 30, 0.25);
  }

  .tour-pop.centered {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(24rem, calc(100vw - 32px));
  }

  .tour-pop.hidden {
    visibility: hidden;
  }

  .tour-title {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: var(--step1);
    margin: 0 0 var(--space-2);
  }

  .tour-text {
    margin: 0 0 var(--space-4);
    color: var(--color-ink-muted);
  }

  .tour-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .tour-count {
    font-size: var(--step-1);
    color: var(--color-ink-faint);
  }

  .tour-buttons {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .btn-link {
    background: none;
    border: none;
    padding: var(--space-1);
    font-size: var(--step-1);
    color: var(--color-ink-muted);
    text-decoration: underline;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce) {
    .tour-spot {
      transition: none;
    }
  }
</style>
