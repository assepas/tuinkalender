import { describe, it, expect } from "vitest";
import { buildCatalog, catalogPartsFromRows, isValidCatalogParts } from "../src/lib/domain/catalog.js";

const species = [
  { id: "wortel", name: "Wortel" },
  { id: "aardbei", name: "Aardbei" },
];
const taskTypes = [{ id: "zaaien", label: "Zaaien" }];
const regions = [{ id: "nl-utrecht", name: "Utrecht" }];

describe("buildCatalog", () => {
  it("sorteert soorten op naam en bouwt indexen", () => {
    const c = buildCatalog({ species, taskTypes, regions });
    expect(c.speciesList.map((s) => s.id)).toEqual(["aardbei", "wortel"]);
    expect(c.speciesIndex.wortel.name).toBe("Wortel");
    expect(c.taskTypeIndex.zaaien.label).toBe("Zaaien");
    expect(c.regions["nl-utrecht"].name).toBe("Utrecht");
  });
});

describe("catalogPartsFromRows", () => {
  it("pakt data uit rijen en sorteert taaktypes op sort", () => {
    const parts = catalogPartsFromRows({
      species: species.map((s) => ({ id: s.id, data: s })),
      taskTypes: [
        { id: "b", sort: 2, data: { id: "b" } },
        { id: "a", sort: 1, data: { id: "a" } },
      ],
      regions: regions.map((r) => ({ id: r.id, data: r })),
    });
    expect(parts.species).toHaveLength(2);
    expect(parts.taskTypes.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("geeft null bij een lege database, zodat de lokale data blijft staan", () => {
    expect(catalogPartsFromRows({ species: [], taskTypes: [], regions: [] })).toBeNull();
    expect(catalogPartsFromRows({ species: null, taskTypes: [], regions: [] })).toBeNull();
  });
});

describe("isValidCatalogParts", () => {
  it("keurt kapotte of lege caches af", () => {
    expect(isValidCatalogParts(null)).toBe(false);
    expect(isValidCatalogParts({ species: [], taskTypes: [1], regions: [1] })).toBe(false);
    expect(isValidCatalogParts({ species: [1], taskTypes: [1], regions: [1] })).toBe(true);
  });
});
