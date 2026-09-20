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
