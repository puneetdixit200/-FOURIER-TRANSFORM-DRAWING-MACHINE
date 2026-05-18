export const MIN_RECORDING_SECONDS = 2;
export const MAX_RECORDING_SECONDS = 30;

export function clampRecordingDuration(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return 6;
  }
  return Math.min(MAX_RECORDING_SECONDS, Math.max(MIN_RECORDING_SECONDS, Math.round(seconds)));
}

export function createGifFramePlan(seconds: number, fps = 15) {
  const duration = clampRecordingDuration(seconds);
  const safeFps = Math.min(24, Math.max(8, Math.round(fps)));
  return {
    delayMs: Math.round(1000 / safeFps),
    durationMs: duration * 1000,
    frameCount: duration * safeFps,
  };
}

