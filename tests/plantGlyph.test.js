import { describe, it, expect } from "vitest";
import { clampCount, cloudCircles, fruitCircles, petalPath, spikeSegments } from "../src/lib/domain/plantGlyph.js";
import { heartColor } from "../src/lib/domain/color.js";

describe("clampCount", () => {
  it("rondt af naar de dichtstbijzijnde toegestane waarde (1, 2, 3, 5, 8, 12)", () => {
    expect(clampCount(1)).toBe(1);
    expect(clampCount(4)).toBe(3);
    expect(clampCount(7)).toBe(8);
    expect(clampCount(10)).toBe(8);
    expect(clampCount(20)).toBe(12);
  });
});

describe("cloudCircles", () => {
  it("geeft count+5 cirkels terug", () => {
    expect(cloudCircles(5)).toHaveLength(10);
    expect(cloudCircles(1)).toHaveLength(6);
    expect(cloudCircles(12)).toHaveLength(17);
  });

  it("is deterministisch: zelfde count geeft altijd hetzelfde beeld", () => {
    expect(cloudCircles(5)).toEqual(cloudCircles(5));
    expect(cloudCircles(3)).toEqual(cloudCircles(3));
  });

  it("geeft alleen eindige, zinnige coördinaten/straal terug", () => {
    for (const c of cloudCircles(8)) {
      expect(Number.isFinite(c.cx)).toBe(true);
      expect(Number.isFinite(c.cy)).toBe(true);
      expect(c.r).toBeGreaterThan(0);
    }
  });
});

describe("fruitCircles", () => {
  it("count=1 is één grote vrucht (appel)", () => {
    const fruits = fruitCircles(1);
    expect(fruits).toHaveLength(1);
    expect(fruits[0].r).toBeGreaterThan(4);
  });

  it("count=2 is een gelijk paar (kersen)", () => {
    const fruits = fruitCircles(2);
    expect(fruits).toHaveLength(2);
    expect(fruits[0].r).toBeCloseTo(fruits[1].r);
  });

  it("count=3, 5, 8, 12 levert precies `count` vruchtjes op", () => {
    for (const n of [3, 5, 8, 12]) {
      expect(fruitCircles(n)).toHaveLength(n);
    }
  });

  it("aalbessentros (5) en druiventros (12) zijn breder boven dan onder", () => {
    for (const n of [5, 12]) {
      const fruits = fruitCircles(n);
      const topRowY = Math.min(...fruits.map((f) => f.cy));
      const bottomRowY = Math.max(...fruits.map((f) => f.cy));
      const widthAt = (y) => {
        const xs = fruits.filter((f) => f.cy === y).map((f) => f.cx);
        return Math.max(...xs) - Math.min(...xs);
      };
      expect(widthAt(topRowY)).toBeGreaterThanOrEqual(widthAt(bottomRowY));
    }
  });

  it("bovenste rijen hebben kleinere vruchtjes dan de onderste (dicht bij de steel)", () => {
    for (const n of [5, 8, 12]) {
      const fruits = fruitCircles(n);
      const topRowY = Math.min(...fruits.map((f) => f.cy));
      const bottomRowY = Math.max(...fruits.map((f) => f.cy));
      const rAt = (y) => fruits.find((f) => f.cy === y).r;
      expect(rAt(topRowY)).toBeLessThanOrEqual(rAt(bottomRowY));
    }
  });
});

describe("petalPath", () => {
  function tipSpread(d) {
    // eerste C-commando is "cx1,cy1 cx2,cy2 tipX,tipY" — het derde punt is de tip.
    const firstC = d.split(" C ")[1];
    const tipPoint = firstC.trim().split(" ")[2];
    return Math.abs(Number(tipPoint.split(",")[0]));
  }

  it("wordt puntiger (kleinere tip-spread) naarmate count toeneemt", () => {
    expect(tipSpread(petalPath(1))).toBeGreaterThan(tipSpread(petalPath(3)));
    expect(tipSpread(petalPath(3))).toBeGreaterThan(tipSpread(petalPath(12)));
  });

  it("count=12 is volledig gesloten tot een punt", () => {
    expect(tipSpread(petalPath(12))).toBeCloseTo(0, 5);
  });

  it("geeft altijd een gesloten pad terug", () => {
    expect(petalPath(1).trim().endsWith("Z")).toBe(true);
    expect(petalPath(12).trim().endsWith("Z")).toBe(true);
  });
});

describe("spikeSegments", () => {
  it("geeft `count` segmenten terug, kleiner wordend naar de top", () => {
    const segs = spikeSegments(8);
    expect(segs).toHaveLength(8);
    expect(segs[0].rx).toBeLessThan(segs[segs.length - 1].rx);
  });
});

describe("heartColor", () => {
  function hueOf(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    return h < 0 ? h + 360 : h;
  }

  it("blijft binnen de geel-tot-bruin band, ongeacht de invoerkleur", () => {
    for (const c of ["#7C8FC4", "#F5F1E6", "#C0392B", "#3A4A2E"]) {
      const hue = hueOf(heartColor(c));
      expect(hue).toBeGreaterThanOrEqual(33);
      expect(hue).toBeLessThanOrEqual(45);
    }
  });

  it("geeft altijd een geldige hex terug, ook bij ongeldige invoer", () => {
    expect(heartColor(undefined)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
