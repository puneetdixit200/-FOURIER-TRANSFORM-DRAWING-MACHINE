export type ComplexPoint = {
  re: number;
  im: number;
};

export type Point = {
  x: number;
  y: number;
};

export const toComplex = (point: Point): ComplexPoint => ({
  re: point.x,
  im: point.y,
});

export const toPoint = (point: ComplexPoint): Point => ({
  x: point.re,
  y: point.im,
});

export const add = (a: ComplexPoint, b: ComplexPoint): ComplexPoint => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const multiply = (a: ComplexPoint, b: ComplexPoint): ComplexPoint => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const magnitude = (point: ComplexPoint) => Math.hypot(point.re, point.im);

export const phase = (point: ComplexPoint) => Math.atan2(point.im, point.re);

export const fromPolar = (radius: number, angle: number): ComplexPoint => ({
  re: radius * Math.cos(angle),
  im: radius * Math.sin(angle),
});

