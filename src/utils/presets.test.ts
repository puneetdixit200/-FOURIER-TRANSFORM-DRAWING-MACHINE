import { describe, expect, it } from "vitest";
import { PRESET_SHAPES } from "./presets";

describe("PRESET_SHAPES", () => {
  it("includes a richer gallery of usable presets", () => {
    expect(PRESET_SHAPES.length).toBeGreaterThanOrEqual(10);
    expect(PRESET_SHAPES.every((preset) => preset.points.length >= 120)).toBe(true);
    expect(PRESET_SHAPES.map((preset) => preset.id)).toContain("butterfly");
    expect(PRESET_SHAPES.map((preset) => preset.id)).toContain("rose");
  });
});

