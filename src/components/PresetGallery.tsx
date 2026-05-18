"use client";

import { PRESET_SHAPES } from "@/utils/presets";

type PresetGalleryProps = {
  activeId?: string;
  onSelect: (id: string) => void;
};

export function PresetGallery({ activeId, onSelect }: PresetGalleryProps) {
  return (
    <div className="preset-grid">
      {PRESET_SHAPES.map((preset) => (
        <button
          className={`preset-button ${activeId === preset.id ? "is-active" : ""}`}
          key={preset.id}
          onClick={() => onSelect(preset.id)}
          type="button"
        >
          <svg viewBox="-220 -220 440 440" aria-hidden="true">
            <polyline
              points={preset.points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="12"
            />
          </svg>
          <span>{preset.name}</span>
        </button>
      ))}
    </div>
  );
}

