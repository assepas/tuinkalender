import { describe, it, expect } from "vitest";
import { shouldWarnAboutBackup, BACKUP_REMINDER_DAYS } from "../src/lib/domain/backup.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-09-22T12:00:00Z").getTime();

describe("shouldWarnAboutBackup", () => {
  it("waarschuwt als er nog nooit geëxporteerd is", () => {
    expect(shouldWarnAboutBackup(null, NOW)).toBe(true);
  });

  it("waarschuwt niet vlak na een export", () => {
    expect(shouldWarnAboutBackup(NOW - DAY_MS, NOW)).toBe(false);
  });

  it("waarschuwt niet precies op de drempel", () => {
    expect(shouldWarnAboutBackup(NOW - BACKUP_REMINDER_DAYS * DAY_MS, NOW)).toBe(false);
  });

  it("waarschuwt zodra de drempel overschreden is", () => {
    expect(shouldWarnAboutBackup(NOW - (BACKUP_REMINDER_DAYS * DAY_MS + 1), NOW)).toBe(true);
  });

  it("waarschuwt ruim na de drempel", () => {
    expect(shouldWarnAboutBackup(NOW - 30 * DAY_MS, NOW)).toBe(true);
  });

  it("houdt rekening met een aangepaste drempel", () => {
    expect(shouldWarnAboutBackup(NOW - 3 * DAY_MS, NOW, 2)).toBe(true);
    expect(shouldWarnAboutBackup(NOW - 1 * DAY_MS, NOW, 2)).toBe(false);
  });
});
