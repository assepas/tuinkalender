import { describe, it, expect } from "vitest";
import {
  monthsBetween,
  addWeeks,
  evaluateWindow,
  parseMonthDay,
  toVisualSegments,
} from "../src/lib/domain/windows.js";

describe("parseMonthDay", () => {
  it("parseert MM-DD naar { month, day }", () => {
    expect(parseMonthDay("05-12")).toEqual({ month: 5, day: 12 });
    expect(parseMonthDay("12-31")).toEqual({ month: 12, day: 31 });
  });
});

describe("monthsBetween", () => {
  it("geeft een gewoon bereik binnen één jaar", () => {
    expect(monthsBetween("03-01", "03-31")).toEqual([3]);
    expect(monthsBetween("06-01", "09-01")).toEqual([6, 7, 8, 9]);
  });

  it("geeft één maand als from en to in dezelfde maand vallen", () => {
    expect(monthsBetween("07-01", "07-20")).toEqual([7]);
  });

  it("wrapt correct over de jaargrens", () => {
    expect(monthsBetween("11-15", "02-28")).toEqual([11, 12, 1, 2]);
    expect(monthsBetween("12-01", "01-15")).toEqual([12, 1]);
  });

  it("dekt het hele jaar bij 01-01 t/m 12-31", () => {
    expect(monthsBetween("01-01", "12-31")).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});

describe("addWeeks", () => {
  it("telt weken op binnen dezelfde maand", () => {
    expect(addWeeks("05-01", 1)).toBe("05-08");
  });

  it("telt weken op over een maandgrens", () => {
    expect(addWeeks("05-28", 1)).toBe("06-04");
  });

  it("wrapt over de jaargrens (december -> januari)", () => {
    expect(addWeeks("12-28", 1)).toBe("01-04");
  });

  it("ondersteunt negatieve offsets (vóór het anker)", () => {
    expect(addWeeks("05-12", -2)).toBe("04-28");
  });

  it("wrapt correct terug over de jaargrens (januari -> december)", () => {
    expect(addWeeks("01-03", -1)).toBe("12-27");
  });
});

describe("toVisualSegments", () => {
  it("geeft één segment voor een aaneengesloten bereik", () => {
    expect(toVisualSegments([6, 7, 8, 9])).toEqual([[6, 9]]);
  });

  it("geeft één segment voor een losse maand", () => {
    expect(toVisualSegments([3])).toEqual([[3, 3]]);
  });

  it("splitst een jaargrens-overschrijdend bereik in twee segmenten", () => {
    expect(toVisualSegments([11, 12, 1, 2])).toEqual([
      [11, 12],
      [1, 2],
    ]);
  });

  it("geeft een lege lijst voor lege input", () => {
    expect(toVisualSegments([])).toEqual([]);
  });
});

describe("evaluateWindow", () => {
  const region = { id: "nl-utrecht", anchors: { lastFrost: "05-12", firstFrost: "10-20", soilWarm: "04-20" } };

  it("evalueert kind: dates", () => {
    const result = evaluateWindow({ kind: "dates", from: "07-15", to: "10-01" }, region);
    expect(result.months).toEqual([7, 8, 9, 10]);
  });

  it("evalueert kind: recurring met frequentielabel", () => {
    const result = evaluateWindow(
      { kind: "recurring", from: "06-01", to: "08-15", every: "2weeks" },
      region
    );
    expect(result.months).toEqual([6, 7, 8]);
    expect(result.frequency).toBe("elke 2 weken");
  });

  it("evalueert kind: relative t.o.v. een regio-anker", () => {
    // lastFrost = 05-12, dus fromWeeks 0..toWeeks 2 -> 05-12 t/m 05-26
    const result = evaluateWindow(
      { kind: "relative", anchor: "lastFrost", fromWeeks: 0, toWeeks: 2 },
      region
    );
    expect(result.months).toEqual([5]);
  });

  it("gooit een duidelijke fout bij een onbekend anker", () => {
    expect(() =>
      evaluateWindow({ kind: "relative", anchor: "nietBestaand", fromWeeks: 0, toWeeks: 1 }, region)
    ).toThrow(/Onbekend anker/);
  });

  it("gooit een duidelijke fout bij een onbekend window-type", () => {
    expect(() => evaluateWindow({ kind: "wekelijksemaan" }, region)).toThrow(/Onbekend window-type/);
  });
});
