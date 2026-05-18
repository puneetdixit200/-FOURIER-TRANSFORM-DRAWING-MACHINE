import type { FourierComponent } from "./dft";

export type FourierVoicePlan = {
  type: OscillatorType;
  frequency: number;
  detune: number;
  gain: number;
  pan: number;
  delaySend: number;
};

const SOOTHING_SCALE = [0, 2, 4, 7, 9];
const VOICE_COUNT = 24;

function clamp(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createFourierVoicePlan(components: FourierComponent[], speed: number): FourierVoicePlan[] {
  const speedTone = clamp(0.82, 0.82 + speed * 0.12, 1.22);

  return components
    .filter((component) => component.frequency !== 0)
    .slice(0, VOICE_COUNT)
    .map((component, index) => {
      const harmonic = Math.abs(component.frequency);
      const octave = Math.floor(index / 8);
      const semitone = SOOTHING_SCALE[(harmonic + index) % SOOTHING_SCALE.length] + octave * 12;
      const frequency = clamp(96, 110 * Math.pow(2, semitone / 12) * speedTone, 820);
      const amplitudeGain = clamp(0.004, component.amplitude / 20000, 0.018);

      return {
        delaySend: 0.12 + (index % 5) * 0.018,
        detune: Math.sin(component.phase) * 7,
        frequency,
        gain: amplitudeGain * (1 - Math.min(0.38, index * 0.011)),
        pan: Math.sin(component.phase * 0.7 + index * 0.74) * 0.68,
        type: index % 3 === 0 ? "triangle" : "sine",
      };
    });
}
