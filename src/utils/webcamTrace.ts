import type { Point } from "./complex";
import { fitPathToBox, resamplePath } from "./pathSmoothing";

export function extractEdgeTrace(
  imageData: ImageData,
  maxWidth: number,
  maxHeight: number,
  targetCount = 420,
): Point[] {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    gray[index] = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
  }

  const edges: Point[] = [];
  let total = 0;
  let cx = 0;
  let cy = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const gx =
        -gray[i - width - 1] -
        2 * gray[i - 1] -
        gray[i + width - 1] +
        gray[i - width + 1] +
        2 * gray[i + 1] +
        gray[i + width + 1];
      const gy =
        -gray[i - width - 1] -
        2 * gray[i - width] -
        gray[i - width + 1] +
        gray[i + width - 1] +
        2 * gray[i + width] +
        gray[i + width + 1];
      const magnitude = Math.hypot(gx, gy);

      if (magnitude > 120) {
        const point = { x, y };
        edges.push(point);
        cx += x;
        cy += y;
        total += 1;
      }
    }
  }

  if (edges.length < 12) {
    return [];
  }

  cx /= total;
  cy /= total;

  const sorted = edges
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
    .filter((_, index) => index % Math.max(1, Math.floor(edges.length / targetCount)) === 0);

  const centered = fitPathToBox(
    sorted.map((point) => ({ x: point.x - width / 2, y: point.y - height / 2 })),
    maxWidth,
    maxHeight,
  );

  return resamplePath(centered, Math.min(targetCount, Math.max(80, centered.length)));
}

