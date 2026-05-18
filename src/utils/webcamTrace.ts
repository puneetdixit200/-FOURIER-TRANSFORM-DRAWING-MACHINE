import type { Point } from "./complex";
import { fitPathToBox, resamplePath } from "./pathSmoothing";

const percentile = (values: number[], ratio: number) => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
};

type EdgePoint = Point & { magnitude: number };

function largestConnectedComponent(points: EdgePoint[], width: number) {
  if (points.length === 0) {
    return [];
  }

  const pointByIndex = new Map<number, EdgePoint>();
  for (const point of points) {
    pointByIndex.set(point.y * width + point.x, point);
  }

  const visited = new Set<number>();
  let largest: EdgePoint[] = [];
  const neighborOffsets = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];

  for (const point of points) {
    const startIndex = point.y * width + point.x;
    if (visited.has(startIndex)) {
      continue;
    }

    const stack = [startIndex];
    const component: EdgePoint[] = [];
    visited.add(startIndex);

    while (stack.length > 0) {
      const currentIndex = stack.pop()!;
      const current = pointByIndex.get(currentIndex);
      if (!current) {
        continue;
      }
      component.push(current);

      for (const offset of neighborOffsets) {
        const nextIndex = currentIndex + offset;
        if (!visited.has(nextIndex) && pointByIndex.has(nextIndex)) {
          visited.add(nextIndex);
          stack.push(nextIndex);
        }
      }
    }

    if (component.length > largest.length) {
      largest = component;
    }
  }

  return largest;
}

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

  const gradients: EdgePoint[] = [];

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
      if (magnitude > 0) {
        gradients.push({ x, y, magnitude });
      }
    }
  }

  const strongGradient = percentile(
    gradients.map((point) => point.magnitude),
    0.86,
  );
  const threshold = Math.max(14, strongGradient * 0.42);
  const edges = gradients.filter((point) => point.magnitude >= threshold);

  if (edges.length < 12) {
    return [];
  }

  const primaryEdges = largestConnectedComponent(edges, width);
  const selectedEdges = primaryEdges.length >= 12 ? primaryEdges : edges;

  let total = 0;
  let cx = 0;
  let cy = 0;
  for (const point of selectedEdges) {
    cx += point.x * point.magnitude;
    cy += point.y * point.magnitude;
    total += point.magnitude;
  }
  cx /= total;
  cy /= total;

  const sorted = selectedEdges
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
    .filter((_, index) => index % Math.max(1, Math.floor(edges.length / Math.max(1, targetCount * 1.8))) === 0);

  const centered = fitPathToBox(
    sorted.map((point) => ({ x: point.x - width / 2, y: point.y - height / 2 })),
    maxWidth,
    maxHeight,
  );

  return resamplePath([...centered, centered[0]], targetCount);
}
