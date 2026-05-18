import { describe, expect, it } from "vitest";
import { cameraOrbitAtTime, depthLiftAtIndex } from "./threeMotion";

describe("threeMotion", () => {
  it("moves the camera through a pronounced 3D orbit", () => {
    const start = cameraOrbitAtTime(0, 1);
    const later = cameraOrbitAtTime(Math.PI * 0.85, 1);

    expect(Math.abs(later.x - start.x)).toBeGreaterThan(320);
    expect(Math.abs(later.y - start.y)).toBeGreaterThan(160);
    expect(Math.abs(later.z - start.z)).toBeGreaterThan(120);
  });

  it("lifts the traced path farther into depth", () => {
    expect(Math.abs(depthLiftAtIndex(32, 128, 1))).toBeGreaterThan(100);
  });
});
