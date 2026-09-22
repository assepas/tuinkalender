<script>
  // Centrale plek voor de taak-glyphs (op taskTypes.icon). De plant-silhouetten
  // (op species.appearance.shape) zitten in PlantGlyph.svelte — een aparte
  // component, want die geometrie is countgedreven en heeft niets gemeen met
  // deze vaste taak-iconen. Een nieuw taaktype in de data levert meteen een
  // passend icoon op zonder dat er hier iets hoeft te veranderen, zolang het
  // om een bestaande "icon"-naam gaat. Een echt nieuw icoon vraagt hier één
  // extra {#if}-tak.
  let { name, color = "currentColor", size = 16, strokeWidth = 1.6 } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === "seed"}
    <path d="M4 18c6-1 14-8 16-14-6 2-13 10-14 16Z" fill={color} fill-opacity="0.35" />
  {:else if name === "seed-kas"}
    <g transform="translate(0, -2)">
      <path d="M3 21V11l9-7 9 7v10" />
      <path d="M7.5 19c3.5-0.5 7.5-4 8.5-8-3.5 1-7.5 5-8.5 8Z" fill={color} fill-opacity="0.35" />
    </g>
  {:else if name === "sprout"}
    <g transform="translate(0, -2.3)">
      <path d="M12 21v-8" />
      <path d="M12 13c0-3 2.2-5.3 5.3-5.3-0.3 3.2-2.4 5.3-5.3 5.3Z" fill={color} fill-opacity="0.5" />
      <path d="M12 13c0-3-2.2-5.3-5.3-5.3 0.3 3.2 2.4 5.3 5.3 5.3Z" fill={color} fill-opacity="0.5" />
    </g>
  {:else if name === "droplet"}
    <path
      d="M12 3.5c3 4 5.5 7.4 5.5 10.3a5.5 5.5 0 1 1-11 0C6.5 10.9 9 7.5 12 3.5Z"
      fill={color}
      fill-opacity="0.4"
    />
  {:else if name === "leaf"}
    <path
      d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z"
      fill={color}
      fill-opacity="0.45"
    />
    <path d="M5 19c3-5 6-8 11-11" />
  {:else if name === "scissors"}
    <circle cx="6.5" cy="7.5" r="2.1" />
    <circle cx="6.5" cy="16.5" r="2.1" />
    <path d="M8.2 8.9 19 19" />
    <path d="M8.2 15.1 19 5" />
  {:else if name === "split"}
    <circle cx="12" cy="5.5" r="2" fill={color} stroke="none" />
    <circle cx="6" cy="18" r="2" fill={color} stroke="none" />
    <circle cx="18" cy="18" r="2" fill={color} stroke="none" />
    <path d="M12 7.5v3.5" />
    <path d="M12 11 6 16" />
    <path d="M12 11l6 5" />
  {:else if name === "snowflake"}
    <path d="M12 3v18" />
    <path d="M5 7.5 19 16.5" />
    <path d="M19 7.5 5 16.5" />
  {:else if name === "basket"}
    <!-- translate: de mand is een stuk zwaarder dan het hengsel erboven,
         dus zakt het silhouet geometrisch onder het midden. -->
    <g transform="translate(0, -1.1)">
      <path d="M7.5 10c0-5.5 9-5.5 9 0" />
      <path
        d="M4 10h16l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H7.3a1.5 1.5 0 0 1-1.5-1.3Z"
        fill={color}
        fill-opacity="0.35"
      />
      <path d="M9 10.5l0.6 9.5" />
      <path d="M12 10.5V20" />
      <path d="M15 10.5l-0.6 9.5" />
    </g>
  {:else if name === "poop"}
    <rect x="3.5" y="15.5" width="17" height="5.5" rx="2.75" fill={color} stroke="none" />
    <rect x="6" y="10.5" width="12" height="5.8" rx="2.9" fill={color} stroke="none" />
    <path d="M9.5 10.8C9.5 7.6 12 6.6 12.6 3c3 1 3.6 4.6 2.4 7.8Z" fill={color} stroke="none" />
    <g stroke="#fff" stroke-opacity="0.4" stroke-width="1" fill="none">
      <path d="M6.5 18.2h4" />
      <path d="M9 13.4h3" />
    </g>
  {:else if name === "ellipsis"}
    <circle cx="5" cy="12" r="2" fill={color} stroke="none" />
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
    <circle cx="19" cy="12" r="2" fill={color} stroke="none" />
  {:else if name === "dot"}
    <circle cx="12" cy="12" r="4.2" fill={color} stroke="none" />
  {:else if name === "dot-outline"}
    <circle cx="12" cy="12" r="4.2" />
  {/if}
</svg>
