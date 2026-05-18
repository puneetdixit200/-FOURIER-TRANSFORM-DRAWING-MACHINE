"use client";

import type { FourierComponent } from "@/utils/dft";

type SpectrumViewProps = {
  components: FourierComponent[];
};

export function SpectrumView({ components }: SpectrumViewProps) {
  const bars = components.slice(0, 48);
  const max = bars.reduce((largest, component) => Math.max(largest, component.amplitude), 1);

  return (
    <div className="spectrum" aria-label="Fourier amplitude spectrum">
      {bars.map((component) => (
        <span
          className="spectrum-bar"
          key={`${component.frequency}-${component.index}`}
          title={`frequency ${component.frequency}, amplitude ${component.amplitude.toFixed(1)}`}
          style={{
            height: `${Math.max(8, (component.amplitude / max) * 100)}%`,
          }}
        />
      ))}
    </div>
  );
}

