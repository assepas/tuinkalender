import { describe, it, expect } from "vitest";
import { deepEqual, mergeGardens } from "../src/lib/domain/merge.js";

const loc = (id, name = id) => ({ id, name });
const plant = (uid, extra = {}) => ({ uid, speciesId: "aardbei", locationId: "buiten", ...extra });

function garden(plantings, locations = [loc("buiten")], extra = {}) {
  return { schemaVersion: 3, region: "nl-utrecht", defaultLocationId: "buiten", locations, plantings, ...extra };
}

describe("deepEqual", () => {
  it("negeert sleutelvolgorde en undefined-velden", () => {
    expect(deepEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, x: undefined }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
  });
});

describe("mergeGardens", () => {
  it("houdt toevoegingen van beide kanten", () => {
    const base = garden([plant("p1")]);
    const mine = garden([plant("p1"), plant("p2")]);
    const theirs = garden([plant("p1"), plant("p3")]);
    expect(mergeGardens(base, mine, theirs).plantings.map((p) => p.uid)).toEqual(["p1", "p3", "p2"]);
  });

  it("neemt per planting de gewijzigde kant", () => {
    const base = garden([plant("p1"), plant("p2")]);
    const mine = garden([plant("p1", { notes: "mijn notitie" }), plant("p2")]);
    const theirs = garden([plant("p1"), plant("p2", { label: "hun label" })]);
    const merged = mergeGardens(base, mine, theirs);
    expect(merged.plantings[0].notes).toBe("mijn notitie");
    expect(merged.plantings[1].label).toBe("hun label");
  });

  it("bij een conflict op hetzelfde item wint de lokale versie", () => {
    const base = garden([plant("p1")]);
    const mine = garden([plant("p1", { notes: "mijn" })]);
    const theirs = garden([plant("p1", { notes: "hun" })]);
    expect(mergeGardens(base, mine, theirs).plantings[0].notes).toBe("mijn");
  });

  it("verwerkt verwijderingen van beide kanten", () => {
    const base = garden([plant("p1"), plant("p2")]);
    const mine = garden([plant("p2")]); // ik verwijderde p1
    const theirs = garden([plant("p1")]); // zij verwijderden p2
    expect(mergeGardens(base, mine, theirs).plantings).toEqual([]);
  });

  it("verwijderd aan de ene kant maar gewijzigd aan de andere blijft staan", () => {
    const base = garden([plant("p1")]);
    const mine = garden([]);
    const theirs = garden([plant("p1", { notes: "net bewerkt" })]);
    expect(mergeGardens(base, mine, theirs).plantings.map((p) => p.uid)).toEqual(["p1"]);
  });

  it("zet plantingen op een door de ander verwijderde standplaats terug naar de standaard", () => {
    const locs = [loc("buiten"), loc("kas")];
    const base = garden([], locs);
    const mine = garden([plant("p1", { locationId: "kas" })], locs);
    const theirs = garden([], [loc("buiten")]);
    const merged = mergeGardens(base, mine, theirs);
    expect(merged.locations.map((l) => l.id)).toEqual(["buiten"]);
    expect(merged.plantings[0].locationId).toBe("buiten");
  });

  it("voegt ook losse velden samen (bv. standaardstandplaats)", () => {
    const locs = [loc("buiten"), loc("kas")];
    const base = garden([], locs);
    const mine = garden([], locs);
    const theirs = garden([], locs, { defaultLocationId: "kas" });
    expect(mergeGardens(base, mine, theirs).defaultLocationId).toBe("kas");
  });

  it("zonder basis gaat aan geen van beide kanten iets verloren", () => {
    const mine = garden([plant("p1", { notes: "lokaal" }), plant("p9")]);
    const theirs = garden([plant("p1", { notes: "server" })]);
    const merged = mergeGardens(null, mine, theirs);
    expect(merged.plantings.map((p) => p.uid)).toEqual(["p1", "p9"]);
    expect(merged.plantings[0].notes).toBe("lokaal");
  });
});
