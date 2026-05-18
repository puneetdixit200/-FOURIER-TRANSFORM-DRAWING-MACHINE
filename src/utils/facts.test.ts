import { describe, expect, it } from "vitest";
import { FOURIER_FACTS, factForElapsedTime } from "./facts";

describe("factForElapsedTime", () => {
  it("rotates facts every 20 seconds", () => {
    expect(factForElapsedTime(0)).toBe(FOURIER_FACTS[0]);
    expect(factForElapsedTime(19_999)).toBe(FOURIER_FACTS[0]);
    expect(factForElapsedTime(20_000)).toBe(FOURIER_FACTS[1]);
    expect(factForElapsedTime(FOURIER_FACTS.length * 20_000)).toBe(FOURIER_FACTS[0]);
  });
});

