import { describe, it, expect } from "vitest";
import { buildTimelineRows, getBloomMonths } from "../src/lib/domain/calendar.js";

const region = { id: "nl-utrecht", anchors: { lastFrost: "05-12", firstFrost: "10-20", soilWarm: "04-20" } };

const speciesIndex = {
  tomaat: {
    id: "tomaat",
    name: "Tomaat",
    appearance: { shape: "bloem", flowerColor: "#E8C547" },
    bloom: { from: "06-15", to: "09-01" },
    tasks: [
      { id: "zaai-kas", type: "zaaien", location: "kas", window: { kind: "dates", from: "03-01", to: "03-31" } },
      { id: "zaai-grond", type: "zaaien", window: { kind: "dates", from: "03-15", to: "04-15" } },
      { id: "water", type: "water", window: { kind: "dates", from: "06-01", to: "08-01" } },
      { id: "snoei", type: "snoeien", importance: "hoofd", window: { kind: "dates", from: "06-01", to: "07-01" } },
      { id: "snoei-licht", type: "snoeien", importance: "licht", window: { kind: "dates", from: "06-01", to: "06-30" } },
      { id: "oogst1", type: "oogsten", window: { kind: "dates", from: "07-01", to: "07-15" } },
      { id: "oogst2", type: "oogsten", window: { kind: "dates", from: "08-01", to: "08-31" } },
    ],
  },
  sla: {
    id: "sla",
    name: "Sla",
    tasks: [{ id: "water", type: "water", window: { kind: "dates", from: "05-01", to: "06-01" } }],
  },
};

const taskTypeIndex = {
  zaaien: {
    id: "zaaien",
    label: "Zaaien",
    color: "#C08A2E",
    icon: "seed",
    variantBy: "location",
    defaultVariant: "grond",
    variants: {
      kas: { label: "Zaaien in kas", icon: "seed-kas" },
      grond: { label: "Zaaien in volle grond", icon: "seed" },
    },
  },
  water: { id: "water", label: "Water geven", color: "#3E7CB1", icon: "droplet" },
  oogsten: { id: "oogsten", label: "Oogsten", color: "#A64B2A", icon: "basket", markerStyle: "bar" },
  snoeien: {
    id: "snoeien",
    label: "Snoeien",
    color: "#6B7A3A",
    icon: "scissors",
    variantBy: "importance",
    defaultVariant: "hoofd",
    variants: { hoofd: { label: "Hoofdsnoei" }, licht: { label: "Lichte snoei", light: true } },
  },
};

// "water" is bewust weggelaten: taaktypes buiten deze lijst komen niet in de tijdlijn.
const taskTypeOrder = ["zaaien", "snoeien", "oogsten"];

function baseGarden(plantings) {
  return { schemaVersion: 2, region: "nl-utrecht", locations: [], plantings };
}

describe("getBloomMonths", () => {
  it("geeft null als de soort geen bloei-data heeft", () => {
    expect(getBloomMonths(speciesIndex.sla)).toBeNull();
  });

  it("evalueert de bloeiperiode naar maanden", () => {
    expect(getBloomMonths(speciesIndex.tomaat)).toEqual([6, 7, 8, 9]);
  });
});

describe("buildTimelineRows", () => {
  const rowFor = (speciesId, extra = {}) =>
    buildTimelineRows(baseGarden([{ uid: "p1", speciesId, ...extra }]), speciesIndex, taskTypeIndex, region, taskTypeOrder)[0];
  const typesIn = (row, month) => row.cells[month - 1].map((m) => m.variantKey ?? m.taskType);

  it("geeft één rij per planting, met 12 maandcellen", () => {
    const rows = buildTimelineRows(
      baseGarden([{ uid: "p1", speciesId: "tomaat" }]), speciesIndex, taskTypeIndex, region, taskTypeOrder
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].cells).toHaveLength(12);
  });

  it("geeft de bloeiperiode en -kleur mee", () => {
    expect(rowFor("tomaat").bloom).toEqual({ months: [6, 7, 8, 9], color: "#E8C547" });
  });

  it("geeft bloom = null als de soort geen bloom-data heeft", () => {
    expect(rowFor("sla").bloom).toBeNull();
  });

  it("laat taaktypes weg die niet in taskTypeOrder staan", () => {
    const row = rowFor("tomaat");
    const allTypes = row.cells.flat().map((m) => m.taskType);
    expect(allTypes).not.toContain("water");
    expect(rowFor("sla").cells.flat()).toHaveLength(0);
  });

  it("zet taken in dezelfde maand naast elkaar, in de volgorde van taskTypeOrder", () => {
    // Maart: zaaien in kas + zaaien in volle grond. Juni: hoofd- en lichte snoei.
    expect(typesIn(rowFor("tomaat"), 3)).toEqual(["kas", "grond"]);
    expect(typesIn(rowFor("tomaat"), 6)).toEqual(["hoofd", "licht"]);
  });

  it("onderscheidt zaaien in kas van volle grond via location (standaard grond)", () => {
    const [kas, grond] = rowFor("tomaat").cells[2];
    expect(kas.meta.icon).toBe("seed-kas");
    expect(grond.meta.icon).toBe("seed");
    expect(grond.meta.label).toBe("Zaaien in volle grond");
    expect(kas.meta.color).toBe("#C08A2E");
  });

  it("markeert lichte snoei via meta.light", () => {
    const [hoofd, licht] = rowFor("tomaat").cells[5];
    expect(hoofd.meta.light).toBeUndefined();
    expect(licht.meta.light).toBe(true);
  });

  it("toont elke planting als eigen rij, ook bij meerdere plantingen van dezelfde soort", () => {
    // Dezelfde soort+standplaats-combinatie kan al niet dubbel voorkomen
    // (zie gardenState.canAddPlanting), dus meerdere rijen van dezelfde
    // soort zijn hier altijd legitiem (andere standplaats/eigen naam).
    const garden = baseGarden([
      { uid: "p1", speciesId: "tomaat", label: "Tomaat kas" },
      { uid: "p2", speciesId: "sla" },
      { uid: "p3", speciesId: "tomaat", label: "Tomaat buiten" },
    ]);
    const rows = buildTimelineRows(garden, speciesIndex, taskTypeIndex, region, taskTypeOrder);
    expect(rows.map((r) => r.planting.uid)).toEqual(["p1", "p2", "p3"]);
    expect(rows.map((r) => r.species.id)).toEqual(["tomaat", "sla", "tomaat"]);
  });

  it("groepeert taken met markerStyle 'bar' (oogsten) tot doorlopende balken i.p.v. maandcellen", () => {
    const row = rowFor("tomaat");
    expect(row.bars).toHaveLength(1);
    const [bar] = row.bars;
    expect(bar.taskType).toBe("oogsten");
    // Twee losse oogsttaken (juli + augustus) smelten samen tot één balk.
    expect(bar.months).toEqual([7, 8]);
    expect(bar.entries).toHaveLength(2);

    const allTypes = row.cells.flat().map((m) => m.taskType);
    expect(allTypes).not.toContain("oogsten");
  });

  it("geeft een lege bars-lijst als de soort geen bar-taaktypes heeft", () => {
    expect(rowFor("sla").bars).toEqual([]);
  });

  it("negeert plantings met een onbekende soort", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "onbekend" }]);
    const rows = buildTimelineRows(garden, speciesIndex, taskTypeIndex, region, taskTypeOrder);
    expect(rows).toHaveLength(0);
  });
});
