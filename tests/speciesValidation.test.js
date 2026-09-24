import { describe, it, expect } from "vitest";
import { validateSpecies, slugify } from "../src/lib/domain/speciesValidation.js";
import aardbei from "../data/species/aardbei.json";

const taskTypeIds = new Set(["planten", "bemesten", "oogsten", "delen", "winterhard", "zaaien"]);

describe("validateSpecies", () => {
  it("keurt een bestaande soort goed", () => {
    expect(validateSpecies(aardbei, { taskTypeIds })).toEqual([]);
  });

  it("geeft leesbare fouten", () => {
    const bad = {
      ...aardbei,
      name: "",
      appearance: { ...aardbei.appearance, flowerColor: "rood" },
      bloom: { from: "5-1", to: "06-01" },
    };
    const errors = validateSpecies(bad, { taskTypeIds });
    expect(errors).toContain("naam: mag niet leeg zijn");
    expect(errors).toContain("bloemkleur: gebruik een kleur als #A1B2C3");
    expect(errors).toContain("bloei van: gebruik MM-DD, bv. 04-15");
  });

  it("controleert taaktypes, dubbele taak-ids en bestaande soort-ids", () => {
    const bad = {
      ...aardbei,
      tasks: [
        { id: "x", type: "bestaatniet", window: { kind: "dates", from: "01-01", to: "02-01" } },
        { id: "x", type: "planten", window: { kind: "dates", from: "01-01", to: "02-01" } },
      ],
    };
    const errors = validateSpecies(bad, { taskTypeIds, existingIds: new Set(["aardbei"]), isNew: true });
    expect(errors).toContain('taak 1: onbekend taaktype "bestaatniet"');
    expect(errors).toContain('taak 2: id "x" komt twee keer voor');
    expect(errors).toContain('id: "aardbei" bestaat al');
  });
});

describe("slugify", () => {
  it("maakt een geldig id van een naam", () => {
    expect(slugify("Gele lis")).toBe("gele-lis");
    expect(slugify("  Crème Brûlée! ")).toBe("creme-brulee");
  });
});
