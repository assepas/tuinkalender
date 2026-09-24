import { describe, it, expect } from "vitest";
import {
  buildLocationIndex,
  findDuplicatePlantings,
  toggleInSet,
  compareByKey,
  filterPlantingRows,
  reassignPlantings,
} from "../src/lib/domain/plantings.js";

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

describe("toggleInSet", () => {
  it("voegt een ontbrekende waarde toe", () => {
    const result = toggleInSet(new Set(["a"]), "b");
    expect([...result]).toEqual(["a", "b"]);
  });

  it("verwijdert een aanwezige waarde", () => {
    const result = toggleInSet(new Set(["a", "b"]), "a");
    expect([...result]).toEqual(["b"]);
  });

  it("muteert de gegeven Set niet", () => {
    const original = new Set(["a"]);
    toggleInSet(original, "b");
    expect([...original]).toEqual(["a"]);
  });
});

describe("compareByKey", () => {
  const rows = [{ name: "Sla" }, { name: "Aardappel" }, { name: "Tomaat" }];

  it("sorteert oplopend op de key-extractor", () => {
    const sorted = [...rows].sort(compareByKey((r) => r.name));
    expect(sorted.map((r) => r.name)).toEqual(["Aardappel", "Sla", "Tomaat"]);
  });

  it("sorteert aflopend met dir 'desc'", () => {
    const sorted = [...rows].sort(compareByKey((r) => r.name, "desc"));
    expect(sorted.map((r) => r.name)).toEqual(["Tomaat", "Sla", "Aardappel"]);
  });
});

describe("filterPlantingRows", () => {
  const rows = [
    { planting: { locationId: "loc1" }, species: { category: "groente" } },
    { planting: { locationId: "loc2" }, species: { category: "fruit" } },
    { planting: { locationId: "loc1" }, species: { category: "fruit" } },
    { planting: { locationId: null }, species: { category: "groente" } },
  ];

  it("geeft alle rijen terug zonder filters", () => {
    expect(filterPlantingRows(rows, new Set(), new Set())).toEqual(rows);
  });

  it("filtert op standplaats", () => {
    const result = filterPlantingRows(rows, new Set(["loc1"]), new Set());
    expect(result).toEqual([rows[0], rows[2]]);
  });

  it("filtert op categorie", () => {
    const result = filterPlantingRows(rows, new Set(), new Set(["fruit"]));
    expect(result).toEqual([rows[1], rows[2]]);
  });

  it("combineert beide filters (AND)", () => {
    const result = filterPlantingRows(rows, new Set(["loc1"]), new Set(["fruit"]));
    expect(result).toEqual([rows[2]]);
  });

  it("een rij zonder locationId valt weg bij een actief standplaatsfilter", () => {
    const result = filterPlantingRows(rows, new Set(["loc1"]), new Set());
    expect(result).not.toContain(rows[3]);
  });
});

describe("reassignPlantings", () => {
  it("verhuist alleen plantingen van de verwijderde standplaats, zonder te muteren", () => {
    const plantings = [
      { uid: "p1", locationId: "weg" },
      { uid: "p2", locationId: "blijft" },
    ];
    const result = reassignPlantings(plantings, "weg", "standaard");
    expect(result.map((p) => p.locationId)).toEqual(["standaard", "blijft"]);
    expect(plantings[0].locationId).toBe("weg");
  });
});
