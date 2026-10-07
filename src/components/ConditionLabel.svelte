<script>
  // Eén groeiomstandigheid (licht, grond, vocht, soort plek) als icoon + tekst,
  // of alleen het icoon met de tekst als tooltip en voor schermlezers.
  // Icoon en kleur komen uit de *_ICONS-maps in plantings.js.
  import Icon from "./Icon.svelte";

  let { icon, color, label, iconOnly = false, size = 18 } = $props();
</script>

{#if iconOnly}
  <span class="condition icon-only" title={label} role="img" aria-label={label}>
    <Icon name={icon} {color} {size} />
  </span>
{:else}
  <span class="condition">
    <Icon name={icon} {color} {size} />
    <span>{label}</span>
  </span>
{/if}

<style>
  .condition {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    vertical-align: middle;
  }

  .condition :global(svg) {
    flex: none;
  }
</style>
