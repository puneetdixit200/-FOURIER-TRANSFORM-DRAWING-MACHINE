import { describe, expect, it } from "vitest";
import { clampZoom, formatZoomPercent, stepZoom } from "./zoom";

describe("zoom controls", () => {
  it("keeps zoom inside the viewer range", () => {
    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(1.35)).toBe(1.35);
    expect(clampZoom(4)).toBe(2.5);
  });

  it("steps zoom predictably and formats the label", () => {
    expect(stepZoom(1, 1)).toBe(1.15);
    expect(stepZoom(1, -1)).toBe(0.85);
    expect(stepZoom(2.45, 1)).toBe(2.5);
    expect(formatZoomPercent(1.15)).toBe("115%");
  });
});
