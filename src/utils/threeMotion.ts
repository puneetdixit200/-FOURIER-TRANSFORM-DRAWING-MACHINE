const TAU = Math.PI * 2;

export type CameraOrbit = {
  x: number;
  y: number;
  z: number;
};

export function depthLiftAtIndex(index: number, total: number, zoom: number) {
  const t = index / Math.max(1, total);
  return (Math.sin(TAU * t) * 148 + Math.cos(TAU * 2.1 * t) * 42) * zoom;
}

export function cameraOrbitAtTime(time: number, zoom: number): CameraOrbit {
  const zoomCompensation = 1 / Math.max(0.75, Math.min(2.2, zoom));

  return {
    x: (Math.sin(time * 0.72) * 380 + Math.sin(time * 1.21) * 90) * zoomCompensation,
    y: Math.cos(time * 0.64) * 220 * zoomCompensation,
    z: 610 + Math.sin(time * 0.58) * 180,
  };
}
