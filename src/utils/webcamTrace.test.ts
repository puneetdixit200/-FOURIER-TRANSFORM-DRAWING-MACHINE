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
});

