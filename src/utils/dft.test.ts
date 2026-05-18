import { describe, expect, it } from "vitest";
import { computeDFT, reconstructPoint, sortByAmplitude } from "./dft";
import type { ComplexPoint } from "./complex";

const closePoint = (actual: ComplexPoint, expected: ComplexPoint, precision = 5) => {
  expect(actual.re).toBeCloseTo(expected.re, precision);
  expect(actual.im).toBeCloseTo(expected.im, precision);
};

describe("computeDFT", () => {
  it("stores a constant drawing in the zero-frequency component", () => {
    const points = Array.from({ length: 8 }, () => ({ re: 2, im: -3 }));

    const components = computeDFT(points);
    const dc = components.find((component) => component.frequency === 0);

    expect(dc?.amplitude).toBeCloseTo(Math.hypot(2, -3), 8);
    expect(dc?.phase).toBeCloseTo(Math.atan2(-3, 2), 8);
    expect(
      components
        .filter((component) => component.frequency !== 0)
        .every((component) => component.amplitude < 1e-10),
    ).toBe(true);
  });

  it("identifies the positive first harmonic for a counter-clockwise circle", () => {
    const count = 32;
    const points = Array.from({ length: count }, (_, index) => {
      const angle = (Math.PI * 2 * index) / count;
      return { re: Math.cos(angle), im: Math.sin(angle) };
    });

    const strongest = sortByAmplitude(computeDFT(points))[0];

    expect(strongest.frequency).toBe(1);
    expect(strongest.amplitude).toBeCloseTo(1, 8);
    expect(strongest.phase).toBeCloseTo(0, 8);
  });

  it("reconstructs source samples when all Fourier components are used", () => {
    const points = [
      { re: -1, im: -1 },
      { re: 1, im: -1 },
      { re: 1, im: 1 },
      { re: -1, im: 1 },
    ];
    const components = computeDFT(points);

    points.forEach((point, index) => {
      const time = (Math.PI * 2 * index) / points.length;
      closePoint(reconstructPoint(components, time), point);
    });
  });
});

