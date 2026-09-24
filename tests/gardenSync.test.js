// Synchronisatie van de cloudtuin (garden.svelte.js) met een nagebootste
// Supabase-laag: opslaan met versiecheck, samenvoegen bij een conflict en
// live updates van een mede-tuinier.
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const server = { row: null, pushes: [], failNextPush: false };
let realtimeHandler = null;

vi.mock("../src/lib/supabase.js", () => ({ supabase: null }));
vi.mock("../src/lib/state/auth.svelte.js", () => ({
  auth: { pendingInvite: null, clearPendingInvite() {} },
}));
vi.mock("../src/lib/storage/cloudGarden.js", () => ({
  listGardens: async () => [{ id: "g1", name: "Tuin", role: "owner" }],
  fetchGarden: async () => structuredClone(server.row),
  pushGarden: async (id, data, version) => {
    server.pushes.push({ version, uids: data.plantings.map((p) => p.uid) });
    if (server.failNextPush || version !== server.row.version) {
      server.failNextPush = false;
      return { ok: false };
    }
    server.row = { ...server.row, data: structuredClone(data), version: server.row.version + 1 };
    return { ok: true, version: server.row.version };
  },
  subscribeToGarden: (id, onUpdate) => {
    realtimeHandler = onUpdate;
    return () => {};
  },
  createGarden: async () => "g1",
  renameGarden: async () => {},
  deleteGarden: async () => {},
  removeMember: async () => {},
  acceptInvite: async () => "g1",
}));

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

let gardenState;
let createEmptyGarden;

beforeAll(async () => {
  globalThis.localStorage = memoryStorage();
  ({ gardenState } = await import("../src/lib/state/garden.svelte.js"));
  ({ createEmptyGarden } = await import("../src/lib/domain/migrate.js"));
});

async function flush() {
  await vi.advanceTimersByTimeAsync(1000);
}

function otherPlanting(garden, uid) {
  return {
    uid,
    speciesId: "aardbei",
    label: "",
    locationId: garden.defaultLocationId,
    notes: "",
    plantedOn: "",
    mutedTasks: [],
    extraTasks: [],
  };
}

describe("cloudtuin synchroniseren", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    server.row = { id: "g1", name: "Tuin", data: createEmptyGarden("nl-utrecht"), version: 1 };
    server.pushes = [];
    server.failNextPush = false;
    await gardenState.setUser(null);
    await gardenState.setUser({ id: "u1" });
  });

  it("opent de tuin uit het account", () => {
    expect(gardenState.mode).toBe("cloud");
    expect(gardenState.cloudGarden.name).toBe("Tuin");
    expect(gardenState.plantings).toEqual([]);
  });

  it("slaat een wijziging op met de juiste versie", async () => {
    const uid = gardenState.addPlanting({ speciesId: "aardbei" });
    await flush();
    expect(server.pushes).toEqual([{ version: 1, uids: [uid] }]);
    expect(server.row.version).toBe(2);
    expect(gardenState.syncStatus).toBe("idle");
  });

  it("voegt samen als een ander intussen iets opsloeg", async () => {
    // Mede-tuinier voegt p-ander toe; die update komt (nog) niet via realtime binnen.
    const theirs = structuredClone(server.row.data);
    theirs.plantings.push(otherPlanting(theirs, "p-ander"));
    server.row = { ...server.row, data: theirs, version: 2 };

    const mine = gardenState.addPlanting({ speciesId: "aardbei", locationId: theirs.defaultLocationId });
    await flush();

    // Eerste poging (versie 1) mislukt, dan samengevoegd opnieuw met versie 2.
    expect(server.pushes.map((p) => p.version)).toEqual([1, 2]);
    expect(server.row.data.plantings.map((p) => p.uid).sort()).toEqual(["p-ander", mine].sort());
    expect(gardenState.plantings.map((p) => p.uid).sort()).toEqual(["p-ander", mine].sort());
  });

  it("neemt live updates van een ander over", () => {
    const theirs = structuredClone(server.row.data);
    theirs.plantings.push(otherPlanting(theirs, "p-live"));
    realtimeHandler({ id: "g1", name: "Tuin", data: theirs, version: 5 });
    expect(gardenState.plantings.map((p) => p.uid)).toEqual(["p-live"]);
  });

  it("negeert een verouderde of eigen echo", () => {
    realtimeHandler({ id: "g1", name: "Tuin", data: { ...server.row.data, plantings: [] }, version: 1 });
    expect(gardenState.plantings).toEqual([]);
  });

  it("gaat na uitloggen terug naar de lokale tuin en wist de cloudkopie", async () => {
    gardenState.addPlanting({ speciesId: "aardbei" });
    await flush();
    await gardenState.setUser(null);
    expect(gardenState.mode).toBe("local");
    expect(gardenState.plantings).toEqual([]);
    expect(localStorage.getItem("tuintaak:cloudGarden:v1")).toBeNull();
  });
});
