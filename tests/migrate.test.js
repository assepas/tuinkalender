import { describe, it, expect } from "vitest";
import { migrateGarden, createEmptyGarden, CURRENT_GARDEN_VERSION } from "../src/lib/domain/migrate.js";

describe("createEmptyGarden", () => {
  it("maakt een leeg, geldig tuindocument", () => {
    const garden = createEmptyGarden("nl-utrecht");
    expect(garden.schemaVersion).toBe(CURRENT_GARDEN_VERSION);
    expect(garden.region).toBe("nl-utrecht");
    expect(garden.plantings).toEqual([]);
  });

  it("heeft meteen één standaardstandplaats: Buiten", () => {
    const garden = createEmptyGarden("nl-utrecht");
    expect(garden.locations).toEqual([{ id: garden.defaultLocationId, name: "Buiten", kind: "buiten" }]);
  });
});

// Een v1-document loopt door tot de huidige versie, dus daar zit ook de
// standaardstandplaats (v2 -> v3) in; deze helper laat alleen de rest zien.
function nonDefaultLocations(garden) {
  return garden.locations.filter((l) => l.id !== garden.defaultLocationId);
}

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

    expect(migrated.schemaVersion).toBe(CURRENT_GARDEN_VERSION);
    expect(nonDefaultLocations(migrated)).toHaveLength(1);
    const [location] = nonDefaultLocations(migrated);
    expect(location).toMatchObject({ name: "kas", kind: "kas", soil: "klei" });
    expect(migrated.plantings.map((p) => p.locationId)).toEqual([location.id, location.id]);
    // position/soil bestaan niet meer op de gemigreerde planting.
    expect(migrated.plantings[0]).not.toHaveProperty("position");
    expect(migrated.plantings[0]).not.toHaveProperty("soil");
  });

  it("maakt geen eigen standplaats aan voor een lege of ontbrekende position (die gaan naar de standaard)", () => {
    const doc = {
      schemaVersion: 1,
      region: "nl-utrecht",
      plantings: [
        { uid: "p1", speciesId: "tomaat", position: "" },
        { uid: "p2", speciesId: "sla" },
      ],
    };
    const migrated = migrateGarden(doc);
    expect(nonDefaultLocations(migrated)).toEqual([]);
    expect(migrated.plantings.map((p) => p.locationId)).toEqual([
      migrated.defaultLocationId,
      migrated.defaultLocationId,
    ]);
  });

  it("geeft een standplaats zonder 'kind' als de legacy position geen bekend soort-plek-woord is", () => {
    const doc = {
      schemaVersion: 1,
      region: "nl-utrecht",
      plantings: [{ uid: "p1", speciesId: "tomaat", position: "Border noord" }],
    };
    const migrated = migrateGarden(doc);
    const [location] = nonDefaultLocations(migrated);
    expect(location).toEqual({ id: location.id, name: "Border noord" });
  });
});

describe("migratie v2 -> v3 (standaardstandplaats)", () => {
  it("voegt Buiten toe en zet plantingen zonder of met onbekende standplaats daarop", () => {
    const doc = {
      schemaVersion: 2,
      region: "nl-utrecht",
      locations: [{ id: "loc-kas", name: "Kas", kind: "kas" }],
      plantings: [
        { uid: "p1", speciesId: "tomaat", locationId: "loc-kas" },
        { uid: "p2", speciesId: "sla", locationId: null },
        { uid: "p3", speciesId: "munt", locationId: "loc-weg" },
      ],
    };
    const migrated = migrateGarden(doc);

    expect(migrated.schemaVersion).toBe(3);
    const defaultLocation = migrated.locations.find((l) => l.id === migrated.defaultLocationId);
    expect(defaultLocation).toMatchObject({ name: "Buiten", kind: "buiten" });
    expect(migrated.locations).toHaveLength(2);
    expect(migrated.plantings.map((p) => p.locationId)).toEqual([
      "loc-kas",
      defaultLocation.id,
      defaultLocation.id,
    ]);
  });

  it("hergebruikt een bestaande standplaats die al Buiten heet", () => {
    const doc = {
      schemaVersion: 2,
      region: "nl-utrecht",
      locations: [{ id: "loc-b", name: " buiten " }],
      plantings: [{ uid: "p1", speciesId: "sla", locationId: null }],
    };
    const migrated = migrateGarden(doc);

    expect(migrated.locations).toEqual([{ id: "loc-b", name: " buiten " }]);
    expect(migrated.defaultLocationId).toBe("loc-b");
    expect(migrated.plantings[0].locationId).toBe("loc-b");
  });
});
