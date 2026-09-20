<script>
  // Eén centrale plek voor alle kleine SVG-iconen: het plant-silhouet
  // (op category.appearance.shape) én de taak-glyphs (op taskTypes.icon).
  // Alles is parametriseerbaar op kleur, dus een nieuw taaktype of een
  // nieuwe plantvorm in de data levert meteen een passend icoon op zonder
  // dat er iets in deze component hoeft te veranderen — zolang het om een
  // van de bestaande "shape"/"icon"-namen gaat. Een echt nieuwe vorm vraagt
  // hier één extra {#if}-tak.

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
  {#if name === "bloem"}
    <circle cx="12" cy="12" r="2.4" fill={color} stroke="none" />
    <circle cx="12" cy="6.5" r="3" fill={color} fill-opacity="0.55" />
    <circle cx="17.5" cy="12" r="3" fill={color} fill-opacity="0.55" />
    <circle cx="12" cy="17.5" r="3" fill={color} fill-opacity="0.55" />
    <circle cx="6.5" cy="12" r="3" fill={color} fill-opacity="0.55" />
  {:else if name === "kruid"}
    <path d="M12 21V9" />
    <path d="M12 13c0-3.5 2.5-6 6-6-0.3 3.6-2.7 6-6 6Z" fill={color} fill-opacity="0.45" />
    <path d="M12 9c0-3.5-2.5-6-6-6-0.3 3.6 2.7 6 6 6Z" fill={color} fill-opacity="0.45" />
  {:else if name === "bes"}
    <path d="M12 13v8" />
    <path d="M8 21h8" />
    <circle cx="9.5" cy="9" r="2.6" fill={color} fill-opacity="0.6" />
    <circle cx="14.5" cy="9" r="2.6" fill={color} fill-opacity="0.6" />
    <circle cx="12" cy="12.5" r="2.6" fill={color} fill-opacity="0.6" />
    <path d="M12 5c1.4 0 2.4 1 2.4 1S13.4 7 12 7s-2.4-1-2.4-1S10.6 5 12 5Z" fill="#6B7A3A" stroke="none" />
  {:else if name === "boom"}
    <path d="M12 21v-7" />
    <circle cx="12" cy="9" r="6" fill={color} fill-opacity="0.5" />
  {:else if name === "bol"}
    <path d="M12 21v-6" />
    <path
      d="M12 4c2.6 0 4.6 3.4 4.6 6.6 0 2.4-2 4.4-4.6 4.4s-4.6-2-4.6-4.4C7.4 7.4 9.4 4 12 4Z"
      fill={color}
      fill-opacity="0.6"
    />
  {:else if name === "struik"}
    <path d="M12 21v-5" />
    <circle cx="8.5" cy="11" r="3.6" fill={color} fill-opacity="0.55" />
    <circle cx="15.5" cy="11" r="3.6" fill={color} fill-opacity="0.55" />
    <circle cx="12" cy="8.5" r="3.6" fill={color} fill-opacity="0.55" />
  {:else if name === "seed"}
    <path d="M4 18c6-1 14-8 16-14-6 2-13 10-14 16Z" fill={color} fill-opacity="0.35" />
  {:else if name === "sprout"}
    <path d="M12 21v-8" />
    <path d="M12 13c0-3 2.2-5.3 5.3-5.3-0.3 3.2-2.4 5.3-5.3 5.3Z" fill={color} fill-opacity="0.5" />
    <path d="M12 13c0-3-2.2-5.3-5.3-5.3 0.3 3.2 2.4 5.3 5.3 5.3Z" fill={color} fill-opacity="0.5" />
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
  {:else if name === "dot"}
    <circle cx="12" cy="12" r="4.2" fill={color} stroke="none" />
  {:else if name === "dot-outline"}
    <circle cx="12" cy="12" r="4.2" />
  {/if}
</svg>
