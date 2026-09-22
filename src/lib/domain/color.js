// Kleurhulp voor bloemkleuren: een lichte of witte bloem verdwijnt op een
// crèmekleurige achtergrond, dus die krijgt een duidelijk donkerdere rand.

const DARK = [58, 58, 42];

function parseHex(hex) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toHex(rgb) {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Wit, crème, lichtgeel: kleuren die weinig contrast hebben met de achtergrond. */
export function isLightColor(hex) {
  const rgb = parseHex(hex);
  return rgb ? luminance(rgb) > 185 : false;
}

/**
 * Een donkerdere variant van `hex` voor randen. Lichte kleuren gaan
 * sterker richting donker dan middentonen, zodat de rand echt opvalt.
 */
export function outlineColor(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return toHex(DARK);
  const t = isLightColor(hex) ? 0.6 : 0.35;
  return toHex(rgb.map((v, i) => v * (1 - t) + DARK[i] * t));
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return toHex(rgb.map((v) => (v + m) * 255));
}

/**
 * Hartkleurtje voor het midden van een bloem-icoon: afgeleid van `flowerColor`,
 * maar altijd binnen een vaste geel-tot-bruin band — de hue van de bloem zelf
 * speelt geen rol, alleen hoe licht/donker hij is (donkere bloem -> donkerbruin
 * hart, lichte bloem -> warmgeel hart).
 */
export function heartColor(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return "#8a6a2a";
  const lum = luminance(rgb) / 255;
  const hue = 34 + 10 * lum;
  const light = 30 + 35 * lum;
  return hslToHex(hue, 60, light);
}
