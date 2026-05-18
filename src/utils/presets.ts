import type { Point } from "./complex";
import { resamplePath } from "./pathSmoothing";

export type PresetShape = {
  id: string;
  name: string;
  points: Point[];
};

const TAU = Math.PI * 2;

const linePath = (segments: Point[], samples = 18) => {
  const points: Point[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    const from = segments[index - 1];
    const to = segments[index];
    for (let sample = 0; sample < samples; sample += 1) {
      const t = sample / samples;
      points.push({
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      });
    }
  }
  points.push(segments[segments.length - 1]);
  return points;
};

function piShape() {
  return linePath(
    [
      { x: -150, y: -120 },
      { x: 150, y: -120 },
      { x: 115, y: -120 },
      { x: 90, y: 130 },
      { x: 40, y: 130 },
      { x: 60, y: -120 },
      { x: -55, y: -120 },
      { x: -78, y: 130 },
      { x: -130, y: 130 },
      { x: -105, y: -120 },
    ],
    20,
  );
}

function infinityShape() {
  return Array.from({ length: 360 }, (_, index) => {
    const t = (TAU * index) / 359;
    return {
      x: 180 * Math.sin(t),
      y: 95 * Math.sin(2 * t),
    };
  });
}

function starShape() {
  const points: Point[] = [];
  for (let index = 0; index <= 10; index += 1) {
    const radius = index % 2 === 0 ? 170 : 72;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return resamplePath(points, 320);
}

function heartShape() {
  return Array.from({ length: 420 }, (_, index) => {
    const t = (TAU * index) / 419;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );
    return { x: x * 12, y: y * 12 };
  });
}

function trebleClefShape() {
  const points: Point[] = [];
  for (let index = 0; index < 320; index += 1) {
    const t = index / 319;
    const angle = 5.5 * TAU * t;
    const radius = 16 + 128 * (1 - t);
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius + 80 - 250 * t,
    });
  }
  points.push(
    ...linePath(
      [
        { x: 8, y: -190 },
        { x: 18, y: -70 },
        { x: -18, y: 170 },
        { x: 44, y: 205 },
        { x: 78, y: 155 },
      ],
      24,
    ),
  );
  return points;
}

export const PRESET_SHAPES: PresetShape[] = [
  { id: "pi", name: "Pi", points: piShape() },
  { id: "infinity", name: "Infinity", points: infinityShape() },
  { id: "star", name: "Star", points: starShape() },
  { id: "heart", name: "Heart", points: heartShape() },
  { id: "treble", name: "Treble", points: trebleClefShape() },
];

export function getPreset(id: string) {
  return PRESET_SHAPES.find((preset) => preset.id === id) ?? PRESET_SHAPES[0];
}

