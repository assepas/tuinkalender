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

describe("migratie v1 -> v2 (standplaatsen)", () => {
  it("smelt plantings met dezelfde legacy position tot één standplaats, en neemt de eerste soil over", () => {
    const doc = {
      schemaVersion: 1,
      region: "nl-utrecht",
      plantings: [
        { uid: "p1", speciesId: "tomaat", position: "kas", soil: "klei" },
        { uid: "p2", speciesId: "sla", position: "kas" },
      ],
    };
    const migrated = migrateGarden(doc);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.locations).toHaveLength(1);
    const [location] = migrated.locations;
    expect(location).toMatchObject({ name: "kas", kind: "kas", soil: "klei" });
    expect(migrated.plantings.map((p) => p.locationId)).toEqual([location.id, location.id]);
    // position/soil bestaan niet meer op de gemigreerde planting.
    expect(migrated.plantings[0]).not.toHaveProperty("position");
    expect(migrated.plantings[0]).not.toHaveProperty("soil");
  });

  it("maakt geen standplaats aan voor een lege of ontbrekende position", () => {
    const doc = {
      schemaVersion: 1,
      region: "nl-utrecht",
      plantings: [
        { uid: "p1", speciesId: "tomaat", position: "" },
        { uid: "p2", speciesId: "sla" },
      ],
    };
    const migrated = migrateGarden(doc);
    expect(migrated.locations).toEqual([]);
    expect(migrated.plantings.map((p) => p.locationId)).toEqual([null, null]);
  });

  it("geeft een standplaats zonder 'kind' als de legacy position geen bekend soort-plek-woord is", () => {
    const doc = {
      schemaVersion: 1,
      region: "nl-utrecht",
      plantings: [{ uid: "p1", speciesId: "tomaat", position: "Border noord" }],
    };
    const migrated = migrateGarden(doc);
    expect(migrated.locations).toEqual([{ id: migrated.locations[0].id, name: "Border noord" }]);
  });
});
