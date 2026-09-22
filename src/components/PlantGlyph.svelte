<script>
  // Tekent de 4 plant-icoon-shapes (vrucht/aar/bloem/losse-wolk), geparametriseerd
  // door `count`. Alle geometrie komt uit plantGlyph.js (puur, los testbaar) —
  // deze component is alleen de render-laag. Losstaand van Icon.svelte, dat de
  // taaktype-glyphs tekent (seed, scissors, basket, ...) — twee onafhankelijke
  // iconenfamilies die niets delen behalve het 24x24-viewBox-idee.
  import { outlineColor, heartColor } from "../lib/domain/color.js";
  import {
    STEM,
    LEAF,
    LEAF_BL_D,
    LEAF_TR_D,
    stemPath,
    petalPath,
    petalAngle,
    BLOEM_CENTER,
    spikeSegments,
    cloudCircles,
    fruitCircles,
    clampCount,
  } from "../lib/domain/plantGlyph.js";

  let { shape, count = 1, color = "currentColor", outline = undefined, fruitColor = undefined, size = 16 } = $props();

  const edge = $derived(outline ?? outlineColor(color));
  const fruitEdge = $derived(outlineColor(fruitColor ?? color));
  const leafD = $derived(shape === "vrucht" ? LEAF_TR_D : LEAF_BL_D);
  const stem = $derived(stemPath(shape, count));

  const n = $derived(clampCount(count));
  const petals = $derived(
    shape === "bloem"
      ? Array.from({ length: n }, (_, i) => ({ d: petalPath(count), angle: petalAngle(i, count) }))
      : []
  );
  const segments = $derived(shape === "aar" ? spikeSegments(count) : []);
  const cloud = $derived(shape === "losse-wolk" ? cloudCircles(count) : []);
  const fruits = $derived(shape === "vrucht" ? fruitCircles(count) : []);
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
  {#if stem}
    <path d={stem} stroke={STEM} stroke-width="1.6" stroke-linecap="round" />
  {/if}
  <path d={leafD} fill={LEAF} stroke={STEM} stroke-width="1" />

  {#if shape === "bloem"}
    {#each petals as petal}
      <path
        d={petal.d}
        fill={color}
        stroke={edge}
        stroke-width="0.9"
        transform={`translate(${BLOEM_CENTER.cx} ${BLOEM_CENTER.cy}) rotate(${petal.angle})`}
      />
    {/each}
    <circle cx={BLOEM_CENTER.cx} cy={BLOEM_CENTER.cy} r="1.3" fill={heartColor(color)} stroke="none" />
  {:else if shape === "aar"}
    {#each segments as seg}
      <ellipse cx={seg.cx} cy={seg.cy} rx={seg.rx} ry={seg.ry} fill={color} stroke={edge} stroke-width="0.8" />
    {/each}
  {:else if shape === "losse-wolk"}
    {#each cloud as c}
      <circle cx={c.cx} cy={c.cy} r={c.r} fill={color} stroke={edge} stroke-width="0.7" />
    {/each}
  {:else if shape === "vrucht"}
    {#each fruits as f}
      <circle cx={f.cx} cy={f.cy} r={f.r} fill={fruitColor} stroke={fruitEdge} stroke-width="0.9" />
    {/each}
  {/if}
</svg>
