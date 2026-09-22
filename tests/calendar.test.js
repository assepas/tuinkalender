import { describe, it, expect } from "vitest";
import { buildCalendar } from "../src/lib/domain/calendar.js";

const region = { id: "nl-utrecht", anchors: { lastFrost: "05-12", firstFrost: "10-20", soilWarm: "04-20" } };

const speciesIndex = {
  tomaat: {
    id: "tomaat",
    name: "Tomaat",
    tasks: [
      { id: "water", type: "water", window: { kind: "dates", from: "06-01", to: "08-01" } },
      {
        id: "opbinden",
        type: "snoeien",
        window: { kind: "dates", from: "06-01", to: "07-01" },
        conditions: { position: ["kas"] },
      },
    ],
  },
};

const locations = [
  { id: "loc-kas", name: "Kas", kind: "kas" },
  { id: "loc-buiten", name: "Border noord", kind: "buiten" },
];

function baseGarden(plantings, extraLocations = locations) {
  return { schemaVersion: 2, region: "nl-utrecht", locations: extraLocations, plantings };
}

describe("buildCalendar", () => {
  it("geeft 12 maanden terug, ook als de tuin leeg is", () => {
    const months = buildCalendar(baseGarden([]), speciesIndex, region);
    expect(months).toHaveLength(12);
    expect(months.every((m) => m.entries.length === 0)).toBe(true);
  });

  it("plaatst een taak in elke maand die het venster overspant", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "tomaat", locationId: "loc-buiten" }]);
    const months = buildCalendar(garden, speciesIndex, region);
    const waterMonths = months.filter((m) => m.entries.some((e) => e.taskId === "water"));
    expect(waterMonths.map((m) => m.month)).toEqual([6, 7, 8]);
  });

  it("respecteert condities op de standplaats (position/kind)", () => {
    const buiten = baseGarden([{ uid: "p1", speciesId: "tomaat", locationId: "loc-buiten" }]);
    const kas = baseGarden([{ uid: "p2", speciesId: "tomaat", locationId: "loc-kas" }]);

    const monthsBuiten = buildCalendar(buiten, speciesIndex, region);
    const monthsKas = buildCalendar(kas, speciesIndex, region);

    expect(monthsBuiten[5].entries.some((e) => e.taskId === "opbinden")).toBe(false);
    expect(monthsKas[5].entries.some((e) => e.taskId === "opbinden")).toBe(true);
  });

  it("behandelt een onopgeloste locationId als 'geen conditie' i.p.v. te crashen", () => {
    // Zelfde permissieve gedrag als vroeger bij een lege planting.position:
    // de conditie kan niet falen als er niets is om tegen te matchen, dus
    // de taak blijft gewoon staan.
    const garden = baseGarden([{ uid: "p1", speciesId: "tomaat", locationId: "loc-verwijderd" }]);
    expect(() => buildCalendar(garden, speciesIndex, region)).not.toThrow();
    const months = buildCalendar(garden, speciesIndex, region);
    expect(months[5].entries.some((e) => e.taskId === "opbinden")).toBe(true);
    expect(months[5].entries.some((e) => e.taskId === "water")).toBe(true);
  });

  it("sluit taken uit die op de planting zijn gemute", () => {
    const garden = baseGarden([
      { uid: "p1", speciesId: "tomaat", locationId: "loc-kas", mutedTasks: ["water"] },
    ]);
    const months = buildCalendar(garden, speciesIndex, region);
    expect(months[5].entries.some((e) => e.taskId === "water")).toBe(false);
    expect(months[5].entries.some((e) => e.taskId === "opbinden")).toBe(true);
  });

  it("voegt extraTasks van de planting toe, los van de soortdata", () => {
    const garden = baseGarden([
      {
        uid: "p1",
        speciesId: "tomaat",
        locationId: "loc-kas",
        extraTasks: [
          { id: "eigen-1", type: "bemesten", window: { kind: "dates", from: "04-01", to: "04-15" } },
        ],
      },
    ]);
    const months = buildCalendar(garden, speciesIndex, region);
    expect(months[3].entries.some((e) => e.taskId === "eigen-1")).toBe(true);
  });

  it("slaat plantings met een onbekende soort stil over i.p.v. te crashen", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "bestaat-niet" }]);
    expect(() => buildCalendar(garden, speciesIndex, region)).not.toThrow();
  });

  it("sorteert entries binnen een maand op taaktype dan naam", () => {
    const twoSpecies = {
      ...speciesIndex,
      appel: {
        id: "appel",
        name: "Appel",
        tasks: [{ id: "water", type: "water", window: { kind: "dates", from: "06-01", to: "06-30" } }],
      },
    };
    const garden = baseGarden([
      { uid: "p1", speciesId: "tomaat", locationId: "loc-buiten" },
      { uid: "p2", speciesId: "appel" },
    ]);
    const months = buildCalendar(garden, twoSpecies, region);
    const juniLabels = months[5].entries.map((e) => e.speciesName);
    expect(juniLabels).toEqual(["Appel", "Tomaat"]);
  });
});
