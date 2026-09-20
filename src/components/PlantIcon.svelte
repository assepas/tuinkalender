<script>
  import Icon from "./Icon.svelte";

  let { species, size = 34, onclick = null } = $props();

  const shape = $derived(species?.appearance?.shape ?? "bloem");
  const color = $derived(species?.appearance?.flowerColor ?? "#5C6350");
</script>

{#if onclick}
  <button
    type="button"
    class="plant-icon clickable"
    style:width={`${size}px`}
    style:height={`${size}px`}
    style:background={`${color}26`}
    style:border-color={`${color}55`}
    {onclick}
    title={`Meer over ${species?.name ?? "deze plant"}`}
  >
    <Icon name={shape} {color} size={Math.round(size * 0.6)} />
  </button>
{:else}
  <span
    class="plant-icon"
    style:width={`${size}px`}
    style:height={`${size}px`}
    style:background={`${color}26`}
    style:border-color={`${color}55`}
  >
    <Icon name={shape} {color} size={Math.round(size * 0.6)} />
  </span>
{/if}

<style>
  .plant-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid;
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
