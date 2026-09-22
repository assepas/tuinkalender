<script>
  // Eén centrale plek voor alle kleine SVG-iconen: het plant-silhouet
  // (op category.appearance.shape) én de taak-glyphs (op taskTypes.icon).
  // Alles is parametriseerbaar op kleur, dus een nieuw taaktype of een
  // nieuwe plantvorm in de data levert meteen een passend icoon op zonder
  // dat er iets in deze component hoeft te veranderen — zolang het om een
  // van de bestaande "shape"/"icon"-namen gaat. Een echt nieuwe vorm vraagt
  // hier één extra {#if}-tak.

  // `outline` is alleen voor de plant-silhouetten: de randkleur van de bloem
  // (donkerder dan `color`, zodat ook witte bloemen zichtbaar blijven).
  let { name, color = "currentColor", size = 16, strokeWidth = 1.6, outline = undefined } = $props();
  const edge = $derived(outline ?? color);

  // Het groen van steel en blad in de plant-silhouetten staat los van de bloemkleur.
  const STEM = "#4E6B32";
  const LEAF = "#86A552";
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
    <path d="M12 22v-9.5" stroke={STEM} stroke-width="1.6" />
    <path d="M12 19.5c-3.6 0-5.6-2-5.8-5 3.4 0 5.6 2 5.8 5Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <path d="M12 17c3-0.2 4.8-1.8 5-4.4-3 0-4.8 1.6-5 4.4Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <g fill={color} stroke={edge} stroke-width="1.1">
      <circle cx="12" cy="4.7" r="2.7" />
      <circle cx="15.14" cy="6.98" r="2.7" />
      <circle cx="13.94" cy="10.67" r="2.7" />
      <circle cx="10.06" cy="10.67" r="2.7" />
      <circle cx="8.86" cy="6.98" r="2.7" />
    </g>
    <circle cx="12" cy="8" r="1.9" fill={edge} stroke="none" />
  {:else if name === "kruid"}
    <path d="M12 22V9" stroke={STEM} stroke-width="1.6" />
    <path d="M12 18.5c0-3.4 2.4-5.6 6-5.6-0.2 3.4-2.6 5.6-6 5.6Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <path d="M12 15c0-3.4-2.4-5.6-6-5.6 0.2 3.4 2.6 5.6 6 5.6Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <g fill={color} stroke={edge} stroke-width="1.1">
      <circle cx="12" cy="4.2" r="2.2" />
      <circle cx="9.6" cy="7.4" r="2.2" />
      <circle cx="14.4" cy="7.4" r="2.2" />
    </g>
  {:else if name === "bes"}
    <path d="M12 4.5v8" stroke={STEM} stroke-width="1.5" />
    <path d="M12 6c0.8-2.6 3.8-3.4 6.2-2.6-0.6 2.6-3.6 4-6.2 2.6Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <g fill={color} stroke={edge} stroke-width="1.1">
      <circle cx="8.6" cy="14" r="3.3" />
      <circle cx="15.4" cy="14" r="3.3" />
      <circle cx="12" cy="18.6" r="3.3" />
    </g>
  {:else if name === "boom"}
    <path d="M12 22v-7" stroke={STEM} stroke-width="1.8" />
    <path d="M12 19c2.8 0 4.6-1.4 5-3.8-2.8 0-4.6 1.4-5 3.8Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <circle cx="12" cy="9" r="6.3" fill={color} stroke={edge} stroke-width="1.2" />
    <g fill={edge} fill-opacity="0.45" stroke="none">
      <circle cx="9.5" cy="8" r="1" />
      <circle cx="14.2" cy="7" r="1" />
      <circle cx="12.5" cy="11.5" r="1" />
    </g>
  {:else if name === "bol"}
    <path d="M12 22v-8" stroke={STEM} stroke-width="1.6" />
    <path d="M12 21.5C8.2 20.6 6.2 16.8 6.6 12.6c3.2 1.4 5.4 4.4 5.4 8.9Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <path d="M12 21.5c3.8-0.9 5.8-4.7 5.4-8.9-3.2 1.4-5.4 4.4-5.4 8.9Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <path
      d="M12 3c2.8 0 5 3.4 5 6.6 0 2.6-2.2 4.4-5 4.4s-5-1.8-5-4.4C7 6.4 9.2 3 12 3Z"
      fill={color}
      stroke={edge}
      stroke-width="1.2"
    />
  {:else if name === "struik"}
    <path d="M12 22v-8" stroke={STEM} stroke-width="1.6" />
    <path d="M12 21c-3.4 0-5.4-1.6-5.8-4.4 3.2 0 5.4 1.6 5.8 4.4Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <path d="M12 20c3-0.2 4.8-1.6 5-4-3 0-4.8 1.6-5 4Z" fill={LEAF} stroke={STEM} stroke-width="1" />
    <g fill={color} stroke={edge} stroke-width="1.1">
      <circle cx="8.4" cy="11.5" r="3.7" />
      <circle cx="15.6" cy="11.5" r="3.7" />
      <circle cx="12" cy="7.8" r="3.7" />
    </g>
  {:else if name === "seed"}
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
