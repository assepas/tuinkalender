<script>
  // Uitklapmenu onder een knop (tuinkiezer, "Mijn tuin ▾"). Sluit bij een
  // klik ernaast, Escape, of als een item `close()` aanroept. De knop zelf
  // komt als `trigger`-snippet binnen (die krijgt open + toggle), de
  // menu-inhoud als `menu`-snippet (die krijgt close). Menu-items gebruiken
  // de klassen .menu-item / .menu-divider uit app.css.
  let { align = "left", minWidth = "13rem", trigger, menu } = $props();

  let open = $state(false);
  let root;

  const toggle = () => (open = !open);
  const close = () => (open = false);

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
    <div class="dropdown-menu" class:align-right={align === "right"} style:min-width={minWidth} role="menu">
      {@render menu(close)}
    </div>
  {/if}
</div>
