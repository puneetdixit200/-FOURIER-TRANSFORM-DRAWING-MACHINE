import { describe, expect, it } from "vitest";
import { resamplePath, smoothCatmullRom } from "./pathSmoothing";

describe("resamplePath", () => {
  it("returns evenly spaced points on an open line", () => {
    const sampled = resamplePath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      6,
    );

    expect(sampled).toHaveLength(6);
    expect(sampled.map((point) => point.x)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(sampled.every((point) => point.y === 0)).toBe(true);
  });

  it("keeps closed paths closed after resampling", () => {
    const sampled = resamplePath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 0 },
      ],
      16,
    );

    expect(sampled[0]).toEqual(sampled[sampled.length - 1]);
  });
});

describe("smoothCatmullRom", () => {
  it("interpolates extra points while preserving endpoints", () => {
    const smoothed = smoothCatmullRom(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 10 },
      ],
      4,
    );

    expect(smoothed.length).toBeGreaterThan(3);
    expect(smoothed[0]).toEqual({ x: 0, y: 0 });
    expect(smoothed[smoothed.length - 1]).toEqual({ x: 20, y: 10 });
  });
});

