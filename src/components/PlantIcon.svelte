<script>
  import Icon from "./Icon.svelte";
  import { outlineColor } from "../lib/domain/color.js";

  let { species, size = 34, onclick = null } = $props();

  const shape = $derived(species?.appearance?.shape ?? "bloem");
  const color = $derived(species?.appearance?.flowerColor ?? "#5C6350");
  const outline = $derived(outlineColor(color));
</script>

{#if onclick}
  <button
    type="button"
    class="plant-icon clickable"
    style:width={`${size}px`}
    style:height={`${size}px`}
    {onclick}
    title={`Meer over ${species?.name ?? "deze plant"}`}
  >
    <Icon name={shape} {color} {outline} size={Math.round(size * 0.68)} />
  </button>
{:else}
  <span
    class="plant-icon"
    style:width={`${size}px`}
    style:height={`${size}px`}
  >
    <Icon name={shape} {color} {outline} size={Math.round(size * 0.68)} />
  </span>
{/if}

<style>
  .plant-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    /* Neutrale (licht groenige) ondergrond, zodat de bloemkleur zelf goed zichtbaar blijft. */
    background: var(--color-plant-bg);
    border: 1px solid var(--color-plant-line);
    flex: none;
    padding: 0;
  }

  button.plant-icon {
    font: inherit;
  }

  .plant-icon.clickable {
    cursor: pointer;
  }

  .plant-icon.clickable:hover {
    filter: brightness(0.96);
  }
</style>
