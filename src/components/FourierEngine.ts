import { computeDFT, epicyclesForError, sortByAmplitude } from "@/utils/dft";
import { toComplex, type Point } from "@/utils/complex";
import {
  boundsOf,
  fitPathToBox,
  resamplePath,
  simplifyPathByDistance,
  smoothCatmullRom,
} from "@/utils/pathSmoothing";

export type PreparedDrawing = {
  points: Point[];
  components: ReturnType<typeof computeDFT>;
  maxEpicycles: number;
};

export function prepareDrawing(
  points: Point[],
  viewport: { width: number; height: number },
  options: { fit?: boolean; sampleCount?: number } = {},
): PreparedDrawing {
  const sampleCount = options.sampleCount ?? 512;
  const maxWidth = Math.max(220, viewport.width * 0.58);
  const maxHeight = Math.max(220, viewport.height * 0.58);
  const fitted = options.fit === false ? points : fitPathToBox(points, maxWidth, maxHeight);
  const simplified = simplifyPathByDistance(fitted, 2);
  const smoothed = smoothCatmullRom(simplified, 5);
  const sampled = resamplePath(smoothed, Math.min(sampleCount, Math.max(96, smoothed.length)));
  const components = sortByAmplitude(computeDFT(sampled.map(toComplex)));

  return {
    points: sampled,
    components,
    maxEpicycles: components.length,
  };
}

export function drawingDifficulty(points: Point[], components: PreparedDrawing["components"]) {
  const box = boundsOf(points);
  const target = Math.max(6, Math.hypot(box.width, box.height) * 0.035);
  return epicyclesForError(points.map(toComplex), components, target);
}

