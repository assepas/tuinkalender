<script>
  // Uitklapmenu onder een knop (tuinkiezer, "Mijn tuin ▾"). Sluit bij een
  // klik ernaast, Escape, of als een item `close()` aanroept. De knop zelf
  // komt als `trigger`-snippet binnen (die krijgt open + toggle), de
  // menu-inhoud als `menu`-snippet (die krijgt close). Menu-items gebruiken
  // de klassen .menu-item / .menu-divider uit app.css.
  let { align = "left", minWidth = "13rem", trigger, menu } = $props();

  let open = $state(false);
  let root;
  let menuEl = $state();
  // Verschuiving zodat het menu binnen het scherm blijft (op mobiel staat de
  // tuinkiezer midden in de kopbalk en past een breed menu er niet onder).
  let shift = $state(0);

  const toggle = () => (open = !open);
  const close = () => (open = false);

  const VIEWPORT_MARGIN = 8;

  $effect(() => {
    if (!open || !menuEl) {
      shift = 0;
      return;
    }
    const rect = menuEl.getBoundingClientRect();
    const overflowRight = rect.right - (window.innerWidth - VIEWPORT_MARGIN);
    const overflowLeft = VIEWPORT_MARGIN - rect.left;
    if (overflowRight > 0) shift = -Math.min(overflowRight, rect.left - VIEWPORT_MARGIN);
    else if (overflowLeft > 0) shift = overflowLeft;
  });

  function handlePointerDown(event) {
    if (open && root && !root.contains(event.target)) close();
  }

  function handleKeydown(event) {
    if (open && event.key === "Escape") close();
  }
</script>

<svelte:document onpointerdown={handlePointerDown} onkeydown={handleKeydown} />

<div class="dropdown" bind:this={root}>
  {@render trigger({ open, toggle })}
  {#if open}
    <div
      bind:this={menuEl}
      class="dropdown-menu"
      class:align-right={align === "right"}
      style:min-width={minWidth}
      style:transform={shift ? `translateX(${shift}px)` : undefined}
      role="menu"
    >
      {@render menu(close)}
    </div>
  {/if}
</div>
