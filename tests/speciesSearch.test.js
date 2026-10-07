import { describe, it, expect } from "vitest";
import {
  colorFamilies,
  emptyFilters,
  countActiveFilters,
  searchSpecies,
  tagOptions,
  filtersForLocation,
  sizeClasses,
} from "../src/lib/domain/speciesSearch.js";
import { normalizeSoil, soilLabel, formatHeight } from "../src/lib/domain/plantings.js";

const species = (id, extra = {}) => ({
  id,
  name: id,
  category: "vaste-plant",
  tags: [],
  growing: { sun: ["zon"], soil: ["zand"], moisture: ["normaal"] },
  ...extra,
});

const lavendel = species("lavendel", {
  latin: "Lavandula angustifolia",
  tags: ["vlinderplant", "geurend"],
  growing: { sun: ["zon"], soil: ["zand", "leem"], moisture: ["droog"] },
  appearance: { flowerColorName: "blauwpaars" },
  bloom: { from: "06-15", to: "08-31" },
});
const hosta = species("hosta", {
  tags: ["schaduwplant"],
  growing: { sun: ["halfschaduw", "schaduw"], soil: ["klei", "leem"], moisture: ["vochtig"] },
  appearance: { flowerColorName: "lila" },
  bloom: { from: "07-01", to: "08-15" },
});
const peterselie = species("peterselie", {
  category: "kruid",
  tags: ["eetbaar", "vlinderplant"],
  growing: { sun: ["zon", "halfschaduw"], soil: ["klei"], moisture: ["normaal"] },
  appearance: { flowerColorName: "geelgroen" },
});
const list = [peterselie, lavendel, hosta];

const filters = (patch) => ({ ...emptyFilters(), ...patch });
const ids = (result) => result.map((s) => s.id);

describe("colorFamilies", () => {
  it("deelt samengestelde en afwijkende namen in", () => {
    expect(colorFamilies({ appearance: { flowerColorName: "wit-roze" } })).toEqual(["wit", "roze"]);
    expect(colorFamilies({ appearance: { flowerColorName: "lila" } })).toEqual(["paars"]);
    expect(colorFamilies({ appearance: { flowerColorName: "crèmewit" } })).toEqual(["wit"]);
    expect(colorFamilies({ appearance: { flowerColorName: "scharlakenrood" } })).toEqual(["rood"]);
    expect(colorFamilies({})).toEqual([]);
  });
});

describe("searchSpecies", () => {
  it("zonder filters: alles, op naam gesorteerd", () => {
    expect(ids(searchSpecies(list, emptyFilters()))).toEqual(["hosta", "lavendel", "peterselie"]);
  });

  it("zoekt in naam, Latijnse naam en tags", () => {
    expect(ids(searchSpecies(list, filters({ query: "lavandula" })))).toEqual(["lavendel"]);
    expect(ids(searchSpecies(list, filters({ query: "schaduwplant" })))).toEqual(["hosta"]);
  });

  it("OF binnen een groep, EN tussen groepen", () => {
    expect(ids(searchSpecies(list, filters({ sun: new Set(["zon", "schaduw"]) })))).toEqual([
      "hosta",
      "lavendel",
      "peterselie",
    ]);
    expect(
      ids(searchSpecies(list, filters({ sun: new Set(["halfschaduw"]), soil: new Set(["leem"]) })))
    ).toEqual(["hosta"]);
  });

  it("tags moeten allemaal kloppen", () => {
    expect(ids(searchSpecies(list, filters({ tags: new Set(["vlinderplant"]) })))).toEqual([
      "lavendel",
      "peterselie",
    ]);
    expect(ids(searchSpecies(list, filters({ tags: new Set(["vlinderplant", "eetbaar"]) })))).toEqual([
      "peterselie",
    ]);
  });

  it("filtert op bloeikleur en bloeimaand; zonder bloei valt een soort dan weg", () => {
    expect(ids(searchSpecies(list, filters({ colors: new Set(["paars"]) })))).toEqual(["hosta", "lavendel"]);
    expect(ids(searchSpecies(list, filters({ months: new Set([6]) })))).toEqual(["lavendel"]);
    expect(ids(searchSpecies(list, filters({ months: new Set([8]) })))).toEqual(["hosta", "lavendel"]);
  });

  it("filtert op herkomst; zonder status telt een soort als onbekend", () => {
    const withStatus = [{ ...lavendel, nativeStatus: "exoot" }, { ...hosta, nativeStatus: "inheems" }, peterselie];
    expect(ids(searchSpecies(withStatus, filters({ native: new Set(["inheems"]) })))).toEqual(["hosta"]);
    expect(ids(searchSpecies(withStatus, filters({ native: new Set(["onbekend", "exoot"]) })))).toEqual([
      "lavendel",
      "peterselie",
    ]);
  });

  it("filtert op grootte; een hoogte van–tot valt in elke klasse die hij raakt", () => {
    const sized = [
      { ...lavendel, growing: { ...lavendel.growing, height: { minCm: 40, maxCm: 60 } } },
      { ...hosta, growing: { ...hosta.growing, height: { minCm: 20, maxCm: 40 } } },
      peterselie,
    ];
    expect(sizeClasses(sized[0])).toEqual(["middel"]);
    expect(sizeClasses(sized[1])).toEqual(["laag"]);
    expect(sizeClasses({ growing: { height: { minCm: 60, maxCm: 300 } } })).toEqual(["middel", "hoog", "zeer-hoog"]);
    expect(ids(searchSpecies(sized, filters({ size: new Set(["laag"]) })))).toEqual(["hosta"]);
  });

  it("filtert op type", () => {
    expect(ids(searchSpecies(list, filters({ categories: new Set(["kruid"]) })))).toEqual(["peterselie"]);
  });
});

describe("hulpjes", () => {
  it("countActiveFilters telt de zoekterm niet mee", () => {
    expect(countActiveFilters(filters({ query: "x", sun: new Set(["zon"]), tags: new Set(["a", "b"]) }))).toBe(3);
  });

  it("tagOptions: meest voorkomende eerst", () => {
    expect(tagOptions(list)[0]).toBe("vlinderplant");
  });

  it("filtersForLocation neemt alleen ingevulde velden over", () => {
    const f = filtersForLocation({ sun: "halfschaduw", soil: "Zware klei" });
    expect([...f.sun]).toEqual(["halfschaduw"]);
    expect([...f.soil]).toEqual(["klei"]);
    expect(f.moisture.size).toBe(0);
  });

  it("formatHeight: cm onder een meter, daarboven meters", () => {
    expect(formatHeight({ minCm: 30, maxCm: 60 })).toBe("30–60 cm");
    expect(formatHeight({ minCm: 40, maxCm: 40 })).toBe("40 cm");
    expect(formatHeight({ minCm: 80, maxCm: 150 })).toBe("0,8–1,5 m");
    expect(formatHeight({ minCm: 300, maxCm: 600 })).toBe("3–6 m");
  });

  it("normalizeSoil en soilLabel herkennen vrije tekst", () => {
    expect(normalizeSoil("Zware klei")).toBe("klei");
    expect(normalizeSoil("potgrond")).toBe(null);
    expect(normalizeSoil("")).toBe(null);
    expect(soilLabel("zandgrond")).toBe("Zand");
    expect(soilLabel("potgrond")).toBe("potgrond");
  });
});
