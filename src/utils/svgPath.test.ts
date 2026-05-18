import { describe, expect, it } from "vitest";
import { extractSvgPathData, sampleSvgPath } from "./svgPath";

describe("sampleSvgPath", () => {
  it("samples a closed polygon path and preserves closure", () => {
    const points = sampleSvgPath("M 0 0 L 10 0 L 10 10 Z", 20);

    expect(points.length).toBeGreaterThanOrEqual(20);
    expect(points[0]).toEqual(points[points.length - 1]);
    expect(points.some((point) => point.x === 10 && point.y === 10)).toBe(true);
  });

  it("samples cubic bezier curves into intermediate points", () => {
    const points = sampleSvgPath("M0 0 C 0 10, 10 10, 10 0", 24);

    expect(points.length).toBeGreaterThanOrEqual(24);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[points.length - 1].x).toBeCloseTo(10, 5);
    expect(points.some((point) => point.y > 5)).toBe(true);
  });
});

describe("extractSvgPathData", () => {
  it("extracts path data from an SVG document", () => {
    const svg = '<svg><path d="M0 0 L1 1" /><path d="M2 2 L3 3" /></svg>';

    expect(extractSvgPathData(svg)).toEqual(["M0 0 L1 1", "M2 2 L3 3"]);
  });
});

