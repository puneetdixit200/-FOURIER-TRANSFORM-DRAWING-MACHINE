import type { Point } from "./complex";

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const almostEqual = (a: Point, b: Point) => distance(a, b) < 1e-6;

export function pathLength(points: Point[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1], points[index]);
  }
  return total;
}

export function resamplePath(points: Point[], targetCount: number): Point[] {
  if (points.length === 0 || targetCount <= 0) {
    return [];
  }

  if (points.length === 1 || targetCount === 1) {
    return [points[0]];
  }

  const closed = almostEqual(points[0], points[points.length - 1]);
  const totalLength = pathLength(points);
  if (totalLength === 0) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const result: Point[] = [{ ...points[0] }];
  const intervals = closed ? targetCount - 1 : targetCount - 1;
  const spacing = totalLength / intervals;
  let segmentStart = points[0];
  let segmentIndex = 1;
  let distanceIntoSegment = 0;
  let segmentLength = distance(segmentStart, points[segmentIndex]);

  for (let sampleIndex = 1; sampleIndex < targetCount - 1; sampleIndex += 1) {
    const targetDistance = sampleIndex * spacing;

    while (
      segmentIndex < points.length - 1 &&
      distanceIntoSegment + segmentLength < targetDistance
    ) {
      distanceIntoSegment += segmentLength;
      segmentStart = points[segmentIndex];
      segmentIndex += 1;
      segmentLength = distance(segmentStart, points[segmentIndex]);
    }

    const localDistance = targetDistance - distanceIntoSegment;
    const t = segmentLength === 0 ? 0 : localDistance / segmentLength;
    const segmentEnd = points[segmentIndex];
    result.push({
      x: segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
      y: segmentStart.y + (segmentEnd.y - segmentStart.y) * t,
    });
  }

  result.push(closed ? { ...result[0] } : { ...points[points.length - 1] });
  return result;
}

export function smoothCatmullRom(points: Point[], samplesPerSegment = 8): Point[] {
  if (points.length < 3) {
    return points.map((point) => ({ ...point }));
  }

  const result: Point[] = [];
  const samples = Math.max(1, Math.floor(samplesPerSegment));

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];

    for (let sample = 0; sample < samples; sample += 1) {
      const t = sample / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      result.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }

  result.push({ ...points[points.length - 1] });
  return result;
}

export function boundsOf(points: Point[]) {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const bounds = points.reduce(
    (box, point) => ({
      minX: Math.min(box.minX, point.x),
      minY: Math.min(box.minY, point.y),
      maxX: Math.max(box.maxX, point.x),
      maxY: Math.max(box.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

export function fitPathToBox(points: Point[], maxWidth: number, maxHeight: number) {
  const bounds = boundsOf(points);
  const width = Math.max(bounds.width, 1);
  const height = Math.max(bounds.height, 1);
  const scale = Math.min(maxWidth / width, maxHeight / height);
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;

  return points.map((point) => ({
    x: (point.x - centerX) * scale,
    y: (point.y - centerY) * scale,
  }));
}

export function simplifyPathByDistance(points: Point[], minDistance: number) {
  if (points.length <= 2) {
    return points;
  }

  const result: Point[] = [points[0]];
  for (const point of points.slice(1)) {
    if (distance(result[result.length - 1], point) >= minDistance) {
      result.push(point);
    }
  }

  if (!almostEqual(result[result.length - 1], points[points.length - 1])) {
    result.push(points[points.length - 1]);
  }

  return result;
}

