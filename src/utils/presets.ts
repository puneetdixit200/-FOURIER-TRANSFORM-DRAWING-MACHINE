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

function spiralShape() {
  return Array.from({ length: 420 }, (_, index) => {
    const t = index / 419;
    const angle = 8.5 * TAU * t;
    const radius = 18 + 164 * t;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
}

function roseShape() {
  return Array.from({ length: 480 }, (_, index) => {
    const t = (TAU * index) / 479;
    const radius = 172 * Math.cos(5 * t);
    return {
      x: Math.cos(t) * radius,
      y: Math.sin(t) * radius,
    };
  });
}

function butterflyShape() {
  return Array.from({ length: 520 }, (_, index) => {
    const t = (TAU * index) / 519;
    const radius =
      Math.exp(Math.cos(t)) -
      2 * Math.cos(4 * t) -
      Math.sin(t / 12) ** 5;
    return {
      x: Math.sin(t) * radius * 58,
      y: -Math.cos(t) * radius * 58,
    };
  });
}

function atomShape() {
  const points: Point[] = [];
  const ellipse = (tilt: number) => {
    for (let index = 0; index < 180; index += 1) {
      const t = (TAU * index) / 179;
      const x = Math.cos(t) * 170;
      const y = Math.sin(t) * 56;
      points.push({
        x: x * Math.cos(tilt) - y * Math.sin(tilt),
        y: x * Math.sin(tilt) + y * Math.cos(tilt),
      });
    }
  };
  ellipse(0);
  ellipse(Math.PI / 3);
  ellipse(-Math.PI / 3);
  return points;
}

function waveShape() {
  return Array.from({ length: 420 }, (_, index) => {
    const t = index / 419;
    const x = -190 + 380 * t;
    return {
      x,
      y: Math.sin(t * TAU * 3) * 82 + Math.sin(t * TAU * 11) * 18,
    };
  });
}

function lightningShape() {
  return resamplePath(
    [
      { x: -42, y: -190 },
      { x: 92, y: -38 },
      { x: 24, y: -38 },
      { x: 98, y: 190 },
      { x: -108, y: -6 },
      { x: -28, y: -6 },
      { x: -42, y: -190 },
    ],
    300,
  );
}

function lissajousShape() {
  return Array.from({ length: 520 }, (_, index) => {
    const t = (TAU * index) / 519;
    return {
      x: 176 * Math.sin(3 * t + Math.PI / 2),
      y: 132 * Math.sin(4 * t),
    };
  });
}

export const PRESET_SHAPES: PresetShape[] = [
  { id: "pi", name: "Pi", points: piShape() },
  { id: "infinity", name: "Infinity", points: infinityShape() },
  { id: "star", name: "Star", points: starShape() },
  { id: "heart", name: "Heart", points: heartShape() },
  { id: "treble", name: "Treble", points: trebleClefShape() },
  { id: "spiral", name: "Spiral", points: spiralShape() },
  { id: "rose", name: "Rose", points: roseShape() },
  { id: "butterfly", name: "Butterfly", points: butterflyShape() },
  { id: "atom", name: "Atom", points: atomShape() },
  { id: "wave", name: "Wave", points: waveShape() },
  { id: "bolt", name: "Bolt", points: lightningShape() },
  { id: "lissajous", name: "Lissajous", points: lissajousShape() },
];

export function getPreset(id: string) {
  return PRESET_SHAPES.find((preset) => preset.id === id) ?? PRESET_SHAPES[0];
}
