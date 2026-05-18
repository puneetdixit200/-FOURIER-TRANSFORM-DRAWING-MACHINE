import { describe, expect, it } from "vitest";
import type { FourierComponent } from "./dft";
import { createFourierVoicePlan } from "./soundDesign";

const components: FourierComponent[] = Array.from({ length: 30 }, (_, index) => ({
  amplitude: 240 - index * 5,
  frequency: index - 15,
  phase: index * 0.23,
}));

describe("createFourierVoicePlan", () => {
  it("uses soft waveform choices and a larger immersive voice bed", () => {
    const plan = createFourierVoicePlan(components, 1);

    expect(plan).toHaveLength(24);
    expect(new Set(plan.map((voice) => voice.type))).toEqual(new Set(["sine", "triangle"]));
    expect(plan.every((voice) => voice.frequency >= 96 && voice.frequency <= 880)).toBe(true);
    expect(plan.every((voice) => voice.gain <= 0.018)).toBe(true);
  });

  it("spreads voices gently across the stereo field", () => {
    const plan = createFourierVoicePlan(components, 1.4);

    expect(Math.min(...plan.map((voice) => voice.pan))).toBeLessThan(-0.35);
    expect(Math.max(...plan.map((voice) => voice.pan))).toBeGreaterThan(0.35);
    expect(plan.every((voice) => voice.delaySend >= 0.12)).toBe(true);
  });
});
