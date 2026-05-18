export const FOURIER_FACTS = [
  "A Fourier series rebuilds a repeating signal from simple sine and cosine waves.",
  "Each epicycle is one complex frequency: radius is amplitude, angle offset is phase.",
  "Sharp corners need many high-frequency terms, which is why square waves ring near edges.",
  "The zero-frequency coefficient is the drawing's average position, also called the DC term.",
  "Sorting epicycles by amplitude makes the biggest visual structure appear first.",
  "Fourier transforms power audio compression, image filtering, MRI scans, and radio systems.",
  "A path can be treated as x + iy, so one transform can describe two-dimensional motion.",
  "Low frequencies capture broad shape; high frequencies capture tiny bends and texture.",
  "The DFT assumes the drawing loops, so the endpoint naturally connects back to the start.",
  "Phase controls where a circle starts; amplitude controls how much it contributes.",
];

export function factForElapsedTime(elapsedMs: number) {
  const index = Math.floor(Math.max(0, elapsedMs) / 20_000) % FOURIER_FACTS.length;
  return FOURIER_FACTS[index];
}

