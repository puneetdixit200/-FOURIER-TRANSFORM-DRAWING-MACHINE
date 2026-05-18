import { describe, expect, it } from "vitest";
import { extractEdgeTrace } from "./webcamTrace";

function makeImageData(width: number, height: number, fill: (x: number, y: number) => number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = fill(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return { data, width, height } as ImageData;
}

describe("extractEdgeTrace", () => {
  it("extracts a low-contrast rectangle using adaptive thresholding", () => {
    const imageData = makeImageData(96, 72, (x, y) => (x > 24 && x < 72 && y > 18 && y < 54 ? 126 : 100));

    const trace = extractEdgeTrace(imageData, 320, 240, 180);

    expect(trace.length).toBe(180);
    expect(Math.max(...trace.map((point) => point.x)) - Math.min(...trace.map((point) => point.x))).toBeGreaterThan(220);
    expect(Math.max(...trace.map((point) => point.y)) - Math.min(...trace.map((point) => point.y))).toBeGreaterThan(150);
  });

  it("prefers the largest connected outline over small high-contrast clutter", () => {
    const imageData = makeImageData(120, 90, (x, y) => {
      if (x > 31 && x < 90 && y > 24 && y < 68) {
        return 126;
      }
      if (x > 4 && x < 18 && y > 5 && y < 19) {
        return 245;
      }
      return 96;
    });

    const trace = extractEdgeTrace(imageData, 360, 260, 220);
    const centerX = trace.reduce((sum, point) => sum + point.x, 0) / trace.length;
    const centerY = trace.reduce((sum, point) => sum + point.y, 0) / trace.length;

    expect(trace.length).toBe(220);
    expect(Math.abs(centerX)).toBeLessThan(35);
    expect(Math.abs(centerY)).toBeLessThan(35);
    expect(trace.filter((point) => point.x < -130 && point.y < -80)).toHaveLength(0);
  });
});
