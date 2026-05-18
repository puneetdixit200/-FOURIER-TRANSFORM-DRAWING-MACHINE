import { fromPolar, magnitude, phase, type ComplexPoint } from "./complex";

export type FourierComponent = {
  frequency: number;
  index: number;
  amplitude: number;
  phase: number;
  re: number;
  im: number;
};

const TAU = Math.PI * 2;

const signedFrequency = (index: number, sampleCount: number) =>
  index <= sampleCount / 2 ? index : index - sampleCount;

export function computeDFT(points: ComplexPoint[]): FourierComponent[] {
  const sampleCount = points.length;
  if (sampleCount === 0) {
    return [];
  }

  return points.map((_, k) => {
    let re = 0;
    let im = 0;

    for (let n = 0; n < sampleCount; n += 1) {
      const angle = (-TAU * k * n) / sampleCount;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const point = points[n];
      re += point.re * cos - point.im * sin;
      im += point.re * sin + point.im * cos;
    }

    re /= sampleCount;
    im /= sampleCount;

    return {
      frequency: signedFrequency(k, sampleCount),
      index: k,
      amplitude: magnitude({ re, im }),
      phase: phase({ re, im }),
      re,
      im,
    };
  });
}

export function sortByAmplitude(components: FourierComponent[]) {
  return [...components].sort((a, b) => b.amplitude - a.amplitude);
}

export function reconstructPoint(
  components: FourierComponent[],
  time: number,
  count = components.length,
): ComplexPoint {
  const limited = components.slice(0, Math.max(0, count));

  return limited.reduce<ComplexPoint>(
    (center, component) => {
      const vector = fromPolar(
        component.amplitude,
        component.frequency * time + component.phase,
      );
      return {
        re: center.re + vector.re,
        im: center.im + vector.im,
      };
    },
    { re: 0, im: 0 },
  );
}

export function reconstructionError(
  source: ComplexPoint[],
  components: FourierComponent[],
  count: number,
) {
  if (source.length === 0) {
    return 0;
  }

  const total = source.reduce((sum, point, index) => {
    const time = (TAU * index) / source.length;
    const reconstructed = reconstructPoint(components, time, count);
    return sum + Math.hypot(point.re - reconstructed.re, point.im - reconstructed.im) ** 2;
  }, 0);

  return Math.sqrt(total / source.length);
}

export function epicyclesForError(
  source: ComplexPoint[],
  components: FourierComponent[],
  targetError: number,
) {
  if (components.length === 0) {
    return 0;
  }

  for (let count = 1; count <= components.length; count += 1) {
    if (reconstructionError(source, components, count) <= targetError) {
      return count;
    }
  }

  return components.length;
}

