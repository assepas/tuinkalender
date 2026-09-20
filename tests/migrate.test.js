import { describe, it, expect } from "vitest";
import { migrateGarden, createEmptyGarden, CURRENT_GARDEN_VERSION } from "../src/lib/domain/migrate.js";

describe("createEmptyGarden", () => {
  it("maakt een leeg, geldig tuindocument", () => {
    const garden = createEmptyGarden("nl-utrecht");
    expect(garden.schemaVersion).toBe(CURRENT_GARDEN_VERSION);
    expect(garden.region).toBe("nl-utrecht");
    expect(garden.plantings).toEqual([]);
  });
});

describe("migrateGarden", () => {
  it("laat een document op de huidige versie ongemoeid", () => {
    const doc = { schemaVersion: CURRENT_GARDEN_VERSION, region: "nl-utrecht", plantings: [] };
    expect(migrateGarden(doc)).toBe(doc);
  });

  it("gooit een fout bij een nieuwere versie dan de app kent", () => {
    const doc = { schemaVersion: CURRENT_GARDEN_VERSION + 1, region: "nl-utrecht", plantings: [] };
    expect(() => migrateGarden(doc)).toThrow(/nieuwer dan wat deze app kent/);
  });

  it("gooit een duidelijke fout als er geen migratiepad is", () => {
    const doc = { schemaVersion: -1, region: "nl-utrecht", plantings: [] };
    expect(() => migrateGarden(doc)).toThrow(/Geen migratiepad/);
  });
});
