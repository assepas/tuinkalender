import { describe, it, expect } from "vitest";
import { isLightColor, outlineColor } from "../src/lib/domain/color.js";

describe("isLightColor", () => {
  it("ziet wit en lichtgeel als licht", () => {
    expect(isLightColor("#F5F1E6")).toBe(true);
    expect(isLightColor("#E8C547")).toBe(true);
  });

  it("ziet roze, paars en rood als niet-licht", () => {
    expect(isLightColor("#D46A8C")).toBe(false);
    expect(isLightColor("#8A6BB0")).toBe(false);
    expect(isLightColor("#C0392B")).toBe(false);
  });

  it("valt terug op false bij een ongeldige kleur", () => {
    expect(isLightColor(undefined)).toBe(false);
    expect(isLightColor("wit")).toBe(false);
  });
});

describe("outlineColor", () => {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  it("maakt de rand altijd donkerder dan de kleur zelf", () => {
    for (const c of ["#F5F1E6", "#E8C547", "#D46A8C", "#8FA6C9"]) {
      expect(lum(outlineColor(c))).toBeLessThan(lum(c));
    }
  });

  it("geeft een licht-op-licht kleur een duidelijk donkere rand", () => {
    expect(lum(outlineColor("#F5F1E6"))).toBeLessThan(150);
  });

  it("geeft altijd een geldige hex terug, ook bij ongeldige invoer", () => {
    expect(outlineColor("#D46A8C")).toMatch(/^#[0-9a-f]{6}$/);
    expect(outlineColor(undefined)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
