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
      { id: "water", type: "water", window: { kind: "dates", from: "06-01", to: "08-01" } },
      { id: "snoei", type: "snoeien", importance: "hoofd", window: { kind: "dates", from: "06-01", to: "07-01" } },
    ],
  },
  sla: {
    id: "sla",
    name: "Sla",
    tasks: [{ id: "water", type: "water", window: { kind: "dates", from: "05-01", to: "06-01" } }],
  },
};

const taskTypeIndex = {
  water: { id: "water", label: "Water geven", color: "#3E7CB1", markerStyle: "bar" },
  snoeien: { id: "snoeien", label: "Snoeien", color: "#6B7A3A", markerStyle: "icon" },
};

const taskTypeOrder = ["water", "snoeien"];

function baseGarden(plantings) {
  return { schemaVersion: 1, region: "nl-utrecht", plantings };
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
  it("geeft één rij per planting, met bloei-lane vooraan als die bestaat", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "tomaat" }]);
    const rows = buildTimelineRows(garden, speciesIndex, taskTypeIndex, region, taskTypeOrder);
    expect(rows).toHaveLength(1);
    expect(rows[0].lanes[0].kind).toBe("bloom");
  });

  it("slaat de bloei-lane over als de soort geen bloom-data heeft", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "sla" }]);
    const rows = buildTimelineRows(garden, speciesIndex, taskTypeIndex, region, taskTypeOrder);
    expect(rows[0].lanes.every((l) => l.kind !== "bloom")).toBe(true);
  });

  it("sorteert task-lanes volgens de opgegeven taskTypeOrder", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "tomaat" }]);
    const rows = buildTimelineRows(garden, speciesIndex, taskTypeIndex, region, taskTypeOrder);
    const taskLaneTypes = rows[0].lanes.filter((l) => l.kind === "task").map((l) => l.taskType);
    expect(taskLaneTypes).toEqual(["water", "snoeien"]);
  });

  it("negeert plantings met een onbekende soort", () => {
    const garden = baseGarden([{ uid: "p1", speciesId: "onbekend" }]);
    const rows = buildTimelineRows(garden, speciesIndex, taskTypeIndex, region, taskTypeOrder);
    expect(rows).toHaveLength(0);
  });
});
