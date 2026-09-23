// Pure geometrie voor de 4 plant-icoon-shapes (vrucht/aar/bloem/losse-wolk).
// Geen Svelte-afhankelijkheden — zo is dit los testbaar (tests/plantGlyph.test.js)
// en blijft PlantGlyph.svelte een dunne render-laag rond deze berekeningen.

export const STEM = "#558429";
export const LEAF = "#86A552";

// Eén vast bladpad per positie — de positie volgt puur uit de shape, nooit uit data.
// LEAF_TR_D is de puntgespiegelde/herpositioneerde variant van LEAF_BL_D, bij de
// kop van de vrucht(en) in plaats van linksonder bij de voet van de steel.
export const LEAF_BL_D = "M9 19.8c-3.4 0.4-5.6-1.4-6.1-4.4 3.4-0.3 5.8 1.4 6.1 4.4Z";
export const LEAF_TR_D = "M15 6.2c3.4 0.4 5.6-1.4 6.1-4.4-3.4-0.3-5.8 1.4-6.1 4.4Z";

const AAR_TOP_Y = 2;
const AAR_LENGTH = 14;
const AAR_X_BASE = 0.5;
const AAR_X_SPREAD = 3;

// Toegestane `count`-waarden — een fibonacci-achtige reeks zodat elk icoon
// visueel duidelijk drukker/voller oogt dan de vorige stap.
const COUNT_STEPS = [1, 2, 3, 5, 8, 12];

/** Rondt `count` af naar de dichtstbijzijnde waarde uit `COUNT_STEPS`. */
export function clampCount(count) {
  const c = Math.max(COUNT_STEPS[0], Math.min(COUNT_STEPS[COUNT_STEPS.length - 1], count));
  return COUNT_STEPS.reduce((closest, step) => (Math.abs(step - c) < Math.abs(closest - c) ? step : closest));
}

function aarBottomY() {
  return AAR_TOP_Y + AAR_LENGTH;
}

/** Steelpad onder de kop. */
export function stemPath(shape) {
  if (shape === "bloem") return "M12 22 L12 10";
  if (shape === "aar") return `M12 22 L12 4}`;
  return null;
}

export const BLOEM_CENTER = { cx: 12, cy: 9.5 };

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
  const L = n === 1 ? 8.0 : 7.5;
  const W = Math.max(1.9, 4.75 - 0.35 * n);
  const t = Math.min(1, n / 12);
  const waist = 0.55 - 0.1 * t;
  const tipSpread = (1 - t) * W * 0.95;
  const wy = -(L * waist);
  const tipY = -L;
  const tipInset = tipY - 0.35 - (1 - t) * 0.25;
  const r2 = (v) => Number(v.toFixed(2));

  return [
    `M 0,0`,
    `C ${r2(-W * 0.72)},${r2(wy * 0.42)} ${r2(-W)},${r2(wy)} ${r2(-tipSpread)},${r2(tipY)}`,
    `C ${r2(-tipSpread * 0.55)},${r2(tipInset)} ${r2(tipSpread * 0.55)},${r2(tipInset)} ${r2(tipSpread)},${r2(tipY)}`,
    `C ${r2(W)},${r2(wy)} ${r2(W * 0.72)},${r2(wy * 0.42)} 0,0`,
    `Z`,
  ].join(" ");
}

/**
 * `count` kleine ovale segmentjes, van groot (onder) naar klein (boven), verspreid
 * over een vaste totale lengte (`AAR_LENGTH`) — `count` verandert dus alleen hoe
 * dicht de segmentjes op elkaar zitten, niet de lengte van de aar zelf.
 */
export function spikeSegments(count) {
  const n = clampCount(count);
  const rMax = n === 1 ? 5 : 1.7;
  const rMin = 0.9;
  const dy = n > 1 ? AAR_LENGTH / (n - 1) : 0;
  const rightCount = Math.ceil(n / 2);
  const leftCount = n - rightCount;
  const segs = [];
  for (let j = 0; j < n; j++) {
    const cy = n === 1 ? AAR_TOP_Y + 5 : AAR_TOP_Y + j * dy;
    const r = n === 1 ? rMax : rMin + (rMax - rMin) * (j / (n - 1));
    // Parabolisch (wortelvormig, dus convex: bolt naar buiten toe i.p.v. hol) zodat
    // de twee kolommen smal bij elkaar starten boven en gebogen uitwaaieren naar
    // onder. De fractie wordt per kolom apart geteld (niet op de gedeelde index
    // `j`), anders belanden bij een oneven `count` het eerste én laatste segment
    // aan dezelfde kant en waaiert de aar scheef naar één kant uit i.p.v. symmetrisch.
    const isLeft = j % 2 === 0;
    const sideCount = isLeft ? leftCount : rightCount;
    const sideIndex = Math.floor(j / 2);
    const frac = sideCount > 1 ? sideIndex / (sideCount - 1) : n > 1 ? j / (n - 1) : 0;
    const xOff = (isLeft ? -1 : 1) * (AAR_X_BASE + AAR_X_SPREAD * Math.sqrt(frac));
    segs.push({ cx: n===1 ? 12 : 12 + xOff, cy, rx: n === 1 ? r : r * 1.2, ry:  n === 1 ? r * 1.2 : r });
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

const CLOUD_TILT = (-12 * Math.PI) / 180;

/**
 * `count + 5` losjes verspreide cirkeltjes rond de kop, zonder duidelijke
 * rangschikking. Deterministisch op `count` (kleur beïnvloedt alleen de
 * vulling, niet de posities), dus reproduceerbaar zonder Math.random().
 * De wolk is opzettelijk langwerpig (breed, plat) en licht gekanteld, zodat
 * de rechterkant omhoog "waait" — geen symmetrische ellips.
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
    const ex = radius * Math.cos(angle) * 1.6;
    const ey = radius * Math.sin(angle) * 0.7;
    out.push({
      cx: 12 + ex * Math.cos(CLOUD_TILT) - ey * Math.sin(CLOUD_TILT),
      cy: 9 + ex * Math.sin(CLOUD_TILT) + ey * Math.cos(CLOUD_TILT),
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
  12: [3, 4, 3, 2, 1],
};

function fruitCirclesRaw(n) {
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
    const rowY = 12 - 2 * (rows.length - 1) + r * 4.0;
    const width = (rowCount - 1) * colSpacing;
    for (let c = 0; c < rowCount; c++) {
      out.push({ cx: 12 - width / 2 + c * colSpacing, cy: rowY, r: rowR });
    }
  });
  return out;
}

function boundingExtent(circles) {
  const minX = Math.min(...circles.map((c) => c.cx - c.r));
  const maxX = Math.max(...circles.map((c) => c.cx + c.r));
  const minY = Math.min(...circles.map((c) => c.cy - c.r));
  const maxY = Math.max(...circles.map((c) => c.cy + c.r));
  return Math.max(maxX - minX, maxY - minY);
}

// Referentiegrootte (silhouet van count=8) waarop elke andere count wordt
// uitgeschaald, zodat de vrucht altijd ongeveer even groot oogt — een hogere
// count betekent dan meer/kleinere vruchtjes i.p.v. een groter icoon.
const FRUIT_REFERENCE_EXTENT = boundingExtent(fruitCirclesRaw(8));

/**
 * `count` vruchtjes: 1 = appel (één grote cirkel), 2 = kersenpaar, 3-12 =
 * kegelvormige tros (smal onder, breed boven) van aalbessentros tot druiventros.
 * Uitgeschaald rond het middelpunt zodat het totale silhouet voor elke count
 * ongeveer even groot blijft (zie `FRUIT_REFERENCE_EXTENT`).
 */
export function fruitCircles(count) {
  const n = clampCount(count);
  const raw = fruitCirclesRaw(n);
  const scale = FRUIT_REFERENCE_EXTENT / boundingExtent(raw);
  return raw.map(({ cx, cy, r }) => ({
    cx: 12 + (cx - 12) * scale,
    cy: 12 + (cy - 12) * scale,
    r: r * scale,
  }));
}
