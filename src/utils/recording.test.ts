import { describe, expect, it } from "vitest";
import { clampRecordingDuration, createGifFramePlan } from "./recording";

describe("clampRecordingDuration", () => {
  it("keeps recording duration inside the export range", () => {
    expect(clampRecordingDuration(1)).toBe(2);
    expect(clampRecordingDuration(7)).toBe(7);
    expect(clampRecordingDuration(90)).toBe(30);
  });
});

describe("createGifFramePlan", () => {
  it("uses the requested duration to determine frame count", () => {
    expect(createGifFramePlan(2, 12)).toEqual({
      delayMs: 83,
      durationMs: 2000,
      frameCount: 24,
    });
    expect(createGifFramePlan(12, 15).frameCount).toBe(180);
  });
});

