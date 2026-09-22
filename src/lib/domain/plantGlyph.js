// Pure geometrie voor de 4 plant-icoon-shapes (vrucht/aar/bloem/losse-wolk).
// Geen Svelte-afhankelijkheden — zo is dit los testbaar (tests/plantGlyph.test.js)
// en blijft PlantGlyph.svelte een dunne render-laag rond deze berekeningen.

export const STEM = "#4E6B32";
export const LEAF = "#86A552";

// Eén vast bladpad per positie — de positie volgt puur uit de shape, nooit uit data.
// LEAF_TR_D is de puntgespiegelde/herpositioneerde variant van LEAF_BL_D, bij de
// kop van de vrucht(en) in plaats van linksonder bij de voet van de steel.
export const LEAF_BL_D = "M9 19.8c-3.4 0.4-5.6-1.4-6.1-4.4 3.4-0.3 5.8 1.4 6.1 4.4Z";
export const LEAF_TR_D = "M15 2.2c3.4-0.4 5.6 1.4 6.1 4.4-3.4 0.3-5.8-1.4-6.1-4.4Z";

const AAR_TOP_Y = 3.4;
const AAR_DY = 1.5;

// Toegestane `count`-waarden — een fibonacci-achtige reeks zodat elk icoon
// visueel duidelijk drukker/voller oogt dan de vorige stap.
const COUNT_STEPS = [1, 2, 3, 5, 8, 12];

/** Rondt `count` af naar de dichtstbijzijnde waarde uit `COUNT_STEPS`. */
export function clampCount(count) {
  const c = Math.max(COUNT_STEPS[0], Math.min(COUNT_STEPS[COUNT_STEPS.length - 1], count));
  return COUNT_STEPS.reduce((closest, step) => (Math.abs(step - c) < Math.abs(closest - c) ? step : closest));
}

function aarBottomY(count) {
  return AAR_TOP_Y + (clampCount(count) - 1) * AAR_DY;
}

/** Steelpad onder de kop. */
export function stemPath(shape, count) {
  if (shape === "bloem") return "M12 22 L12 10.4";
  if (shape === "aar") return `M12 22 L12 ${(aarBottomY(count) + 0.8).toFixed(2)}`;
  return null;
}

export const BLOEM_CENTER = { cx: 12, cy: 7.4 };

/** Hoek (graden) van bloemblaadje `index` van de `count` blaadjes, 0° = boven. */
export function petalAngle(index, count) {
  return index * (360 / clampCount(count));
}

/**
 * Bloemblaadje-pad: basis op de oorsprong, top wijst naar boven (-y). Eén
 * doorlopende formule — hoe hoger `count`, hoe smaller/puntiger het blaadje.
 * Bij count=1 een brede, gesloten, afgeronde vorm (leest als een tulp).
 */
export function petalPath(count) {
  const n = clampCount(count);
  const L = n === 1 ? 6.4 : 6.0;
  const W = Math.max(1.5, 3.8 - 0.28 * n);
  const t = Math.min(1, n / 12);
  const waist = 0.55 - 0.1 * t;
  const tipSpread = (1 - t) * W * 0.95;
  const wy = -(L * waist);
  const tipY = -L;
  const tipInset = tipY - (1 - t) * 0.4;
  const r2 = (v) => Number(v.toFixed(2));

  return [
    `M 0,0`,
    `C ${r2(-W * 0.6)},${r2(wy * 0.35)} ${r2(-W)},${r2(wy)} ${r2(-tipSpread)},${r2(tipY)}`,
    `C ${r2(-tipSpread * 0.3)},${r2(tipInset)} ${r2(tipSpread * 0.3)},${r2(tipInset)} ${r2(tipSpread)},${r2(tipY)}`,
    `C ${r2(W)},${r2(wy)} ${r2(W * 0.6)},${r2(wy * 0.35)} 0,0`,
    `Z`,
  ].join(" ");
}

/** `count` kleine ovale segmentjes, van groot (onder) naar klein (boven). */
export function spikeSegments(count) {
  const n = clampCount(count);
  const rMax = n === 1 ? 1.7 : 1.6;
  const rMin = 0.9;
  const segs = [];
  for (let j = 0; j < n; j++) {
    const cy = AAR_TOP_Y + j * AAR_DY;
    const r = n === 1 ? rMax : rMin + (rMax - rMin) * (j / (n - 1));
    const xOff = (j % 2 === 0 ? -1 : 1) * (j / n) * 2;
    segs.push({ cx: 12 + xOff, cy, rx: r, ry: r * 1.2 });
  }
  return segs;
}

// Kleine, zelfstandige seeded PRNG (mulberry32) — geen Math.random(), zodat
// hetzelfde `count` altijd hetzelfde wolkbeeld geeft.
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const CLOUD_SEED = 0x9e3779b9;
const GOLDEN_ANGLE = 137.50776;

/**
 * `count + 5` losjes verspreide cirkeltjes rond de kop, zonder duidelijke
 * rangschikking. Deterministisch op `count` (kleur beïnvloedt alleen de
 * vulling, niet de posities), dus reproduceerbaar zonder Math.random().
 */
export function cloudCircles(count) {
  const n = clampCount(count);
  const total = n + 5;
  const rng = mulberry32(CLOUD_SEED);
  const out = [];
  for (let k = 0; k < total; k++) {
    const jitterA = (rng() - 0.5) * 55;
    const jitterR = (rng() - 0.5) * 2.4;
    const r = 1.4 + rng() * 0.3;
    const angle = ((k * GOLDEN_ANGLE + jitterA) * Math.PI) / 180;
    const radius = Math.max(0.6, 6.2 * Math.sqrt((k + 0.5) / total) + jitterR);
    out.push({
      cx: 12 + radius * Math.cos(angle) * 1.05,
      cy: 9 + radius * Math.sin(angle) * 0.82,
      r,
    });
  }
  return out;
}

// Rijtabel (boven→onder aantal cirkels) per toegestane count (3, 5, 8, 12), telt op tot count.
// count=5 -> [2,2,1] (aalbessentros), count=12 -> [4,4,3,1] (druiventros).
const FRUIT_ROWS = {
  3: [2, 1],
  5: [2, 2, 1],
  8: [3, 3, 2],
  12: [4, 4, 3, 1],
};

/**
 * `count` vruchtjes: 1 = appel (één grote cirkel), 2 = kersenpaar, 3-12 =
 * kegelvormige tros (smal onder, breed boven) van aalbessentros tot druiventros.
 */
export function fruitCircles(count) {
  const n = clampCount(count);
  if (n === 1) return [{ cx: 12, cy: 12, r: 7 }];
  if (n === 2)
    return [
      { cx: 8.7, cy: 12, r: 5 },
      { cx: 15.3, cy: 12, r: 5 },
    ];
  const rows = FRUIT_ROWS[n];
  const out = [];
  rows.forEach((rowCount, r) => {
    // Bovenste rijen kleiner, onderste (dichtst bij de steel) groter.
    const rowR = Math.max(3, 3.5 - 0.2 * (rows.length - 1 - r));
    const colSpacing = rowR * 1.7;
    const rowY = 6.2 + r * 4.0;
    const width = (rowCount - 1) * colSpacing;
    for (let c = 0; c < rowCount; c++) {
      out.push({ cx: 12 - width / 2 + c * colSpacing, cy: rowY, r: rowR });
    }
  });
  return out;
}
