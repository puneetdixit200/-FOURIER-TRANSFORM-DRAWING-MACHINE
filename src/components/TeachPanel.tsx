"use client";

import type { FourierComponent } from "@/utils/dft";

type TeachPanelProps = {
  visible: boolean;
  components: FourierComponent[];
  epicycleCount: number;
  maxEpicycles: number;
  mode: string;
};

export function TeachPanel({
  visible,
  components,
  epicycleCount,
  maxEpicycles,
  mode,
}: TeachPanelProps) {
  if (!visible) {
    return null;
  }

  const strongest = components[0];
  const detailPercent = Math.round((epicycleCount / Math.max(1, maxEpicycles)) * 100);

  return (
    <aside className="teach-board">
      <div className="teach-kicker">Teach mode</div>
      <h2>What the circles mean</h2>
      <p>
        Your drawing is treated as points on the complex plane. The DFT turns that path into rotating vectors.
        Each circle is one frequency, and the final tip traces the reconstructed drawing.
      </p>
      <div className="teach-grid">
        <div>
          <span>Visible epicycles</span>
          <b>{epicycleCount}</b>
          <small>{detailPercent}% of available detail</small>
        </div>
        <div>
          <span>Strongest frequency</span>
          <b>{strongest ? strongest.frequency : 0}</b>
          <small>Biggest circle in the chain</small>
        </div>
        <div>
          <span>Radius</span>
          <b>{strongest ? strongest.amplitude.toFixed(1) : "0.0"}</b>
          <small>Amplitude of that harmonic</small>
        </div>
        <div>
          <span>Phase</span>
          <b>{strongest ? strongest.phase.toFixed(2) : "0.00"}</b>
          <small>Starting angle in radians</small>
        </div>
      </div>
      <ul>
        <li>Low frequencies draw broad structure first.</li>
        <li>High frequencies add corners, loops, and tiny wiggles.</li>
        <li>Mode: {mode === "dual" ? "X/Y components are separated" : mode === "three" ? "The path is lifted into depth" : "Complex epicycles draw the whole path"}.</li>
      </ul>
    </aside>
  );
}

