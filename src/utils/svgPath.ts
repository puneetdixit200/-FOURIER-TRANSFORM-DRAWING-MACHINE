import type { Point } from "./complex";
import { resamplePath } from "./pathSmoothing";

type Command = {
  code: string;
  values: number[];
};

const COMMAND_OR_NUMBER = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi;
const COMMAND_LENGTHS: Record<string, number> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  Z: 0,
};

function tokenize(path: string) {
  return path.match(COMMAND_OR_NUMBER) ?? [];
}

function parseCommands(path: string): Command[] {
  const tokens = tokenize(path);
  const commands: Command[] = [];
  let index = 0;
  let active = "";

  while (index < tokens.length) {
    const token = tokens[index];
    if (/^[a-zA-Z]$/.test(token)) {
      active = token;
      index += 1;
    }

    const upper = active.toUpperCase();
    const length = COMMAND_LENGTHS[upper];
    if (length === undefined) {
      throw new Error(`Unsupported SVG command: ${active}`);
    }

    if (length === 0) {
      commands.push({ code: active, values: [] });
      active = "";
      continue;
    }

    while (index < tokens.length && !/^[a-zA-Z]$/.test(tokens[index])) {
      const values = tokens
        .slice(index, index + length)
        .map((value) => Number.parseFloat(value));
      if (values.length < length || values.some(Number.isNaN)) {
        break;
      }
      commands.push({ code: active, values });
      index += length;

      if (upper === "M") {
        active = active === "M" ? "L" : "l";
      }
    }
  }

  return commands;
}

const cubic = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  };
};

const quadratic = (p0: Point, p1: Point, p2: Point, t: number): Point => {
  const mt = 1 - t;
  return {
    x: mt ** 2 * p0.x + 2 * mt * t * p1.x + t ** 2 * p2.x,
    y: mt ** 2 * p0.y + 2 * mt * t * p1.y + t ** 2 * p2.y,
  };
};

const pointFrom = (current: Point, x: number, y: number, relative: boolean): Point => ({
  x: relative ? current.x + x : x,
  y: relative ? current.y + y : y,
});

function pushLine(points: Point[], from: Point, to: Point, steps = 12) {
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    points.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }
}

export function sampleSvgPath(path: string, targetCount = 256): Point[] {
  const commands = parseCommands(path);
  const points: Point[] = [];
  let current: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let lastControl: Point | null = null;

  for (const command of commands) {
    const relative = command.code === command.code.toLowerCase();
    const code = command.code.toUpperCase();
    const values = command.values;

    if (code === "M") {
      current = pointFrom(current, values[0], values[1], relative);
      start = current;
      points.push({ ...current });
      lastControl = null;
    }

    if (code === "L") {
      const next = pointFrom(current, values[0], values[1], relative);
      pushLine(points, current, next);
      current = next;
      lastControl = null;
    }

    if (code === "H") {
      const next = { x: relative ? current.x + values[0] : values[0], y: current.y };
      pushLine(points, current, next);
      current = next;
      lastControl = null;
    }

    if (code === "V") {
      const next = { x: current.x, y: relative ? current.y + values[0] : values[0] };
      pushLine(points, current, next);
      current = next;
      lastControl = null;
    }

    if (code === "C") {
      const p0 = current;
      const p1 = pointFrom(current, values[0], values[1], relative);
      const p2 = pointFrom(current, values[2], values[3], relative);
      const p3 = pointFrom(current, values[4], values[5], relative);
      for (let i = 1; i <= 24; i += 1) {
        points.push(cubic(p0, p1, p2, p3, i / 24));
      }
      current = p3;
      lastControl = p2;
    }

    if (code === "S") {
      const p0 = current;
      const reflected: Point = lastControl
        ? { x: current.x * 2 - lastControl.x, y: current.y * 2 - lastControl.y }
        : current;
      const p2 = pointFrom(current, values[0], values[1], relative);
      const p3 = pointFrom(current, values[2], values[3], relative);
      for (let i = 1; i <= 24; i += 1) {
        points.push(cubic(p0, reflected, p2, p3, i / 24));
      }
      current = p3;
      lastControl = p2;
    }

    if (code === "Q") {
      const p0 = current;
      const p1 = pointFrom(current, values[0], values[1], relative);
      const p2 = pointFrom(current, values[2], values[3], relative);
      for (let i = 1; i <= 20; i += 1) {
        points.push(quadratic(p0, p1, p2, i / 20));
      }
      current = p2;
      lastControl = p1;
    }

    if (code === "T") {
      const p0 = current;
      const p1: Point = lastControl
        ? { x: current.x * 2 - lastControl.x, y: current.y * 2 - lastControl.y }
        : current;
      const p2 = pointFrom(current, values[0], values[1], relative);
      for (let i = 1; i <= 20; i += 1) {
        points.push(quadratic(p0, p1, p2, i / 20));
      }
      current = p2;
      lastControl = p1;
    }

    if (code === "Z") {
      pushLine(points, current, start);
      current = start;
      lastControl = null;
    }
  }

  return points.length >= targetCount ? points : resamplePath(points, targetCount);
}

export function extractSvgPathData(svgText: string) {
  const matches = svgText.matchAll(/<path\b[^>]*\sd=(["'])([\s\S]*?)\1/gi);
  return Array.from(matches, (match) => match[2].trim()).filter(Boolean);
}
