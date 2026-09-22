import { describe, it, expect } from "vitest";
import { buildLocationIndex, findDuplicatePlantings } from "../src/lib/domain/plantings.js";

describe("buildLocationIndex", () => {
  it("geeft een lege index voor een lege of ontbrekende lijst", () => {
    expect(buildLocationIndex([])).toEqual({});
    expect(buildLocationIndex(undefined)).toEqual({});
  });

  it("indexeert standplaatsen op id", () => {
    const locations = [
      { id: "loc1", name: "Kas" },
      { id: "loc2", name: "Border noord" },
    ];
    const index = buildLocationIndex(locations);
    expect(index.loc1).toBe(locations[0]);
    expect(index.loc2).toBe(locations[1]);
  });
});

describe("findDuplicatePlantings", () => {
  const garden = {
    plantings: [
      { uid: "p1", speciesId: "tomaat", locationId: "loc1" },
      { uid: "p2", speciesId: "sla", locationId: "loc1" },
      { uid: "p3", speciesId: "tomaat", locationId: "loc2" },
      { uid: "p4", speciesId: "tomaat", locationId: null },
    ],
  };

  it("geeft niets terug als er geen match is", () => {
    expect(findDuplicatePlantings(garden, "sla", "loc2")).toEqual([]);
  });

  it("vindt een exacte soort+standplaats-match", () => {
    const matches = findDuplicatePlantings(garden, "tomaat", "loc1");
    expect(matches.map((p) => p.uid)).toEqual(["p1"]);
  });

  it("sluit de eigen uid uit (bewerken van een bestaande planting)", () => {
    expect(findDuplicatePlantings(garden, "tomaat", "loc1", "p1")).toEqual([]);
  });

  it("telt een andere standplaats niet als dubbel", () => {
    expect(findDuplicatePlantings(garden, "tomaat", "loc3")).toEqual([]);
  });

  it("geeft niets terug zonder speciesId of zonder locationId", () => {
    expect(findDuplicatePlantings(garden, "", "loc1")).toEqual([]);
    expect(findDuplicatePlantings(garden, "tomaat", null)).toEqual([]);
    expect(findDuplicatePlantings(garden, "tomaat", undefined)).toEqual([]);
  });
});
