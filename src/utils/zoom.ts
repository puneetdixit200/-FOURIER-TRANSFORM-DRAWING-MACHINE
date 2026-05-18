export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 0.15;

export function clampZoom(value: number) {
  return Number(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)).toFixed(2));
}

export function stepZoom(current: number, direction: -1 | 1) {
  return clampZoom(current + direction * ZOOM_STEP);
}

export function formatZoomPercent(value: number) {
  return `${Math.round(clampZoom(value) * 100)}%`;
}
