"use client";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { formatZoomPercent } from "@/utils/zoom";

type ZoomToolbarProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

export function ZoomToolbar({ zoom, onZoomIn, onZoomOut, onResetZoom }: ZoomToolbarProps) {
  return (
    <div aria-label="Canvas zoom controls" className="zoom-toolbar" role="group">
      <button aria-label="Zoom out" className="zoom-button" onClick={onZoomOut} title="Zoom out" type="button">
        <ZoomOut size={17} />
      </button>
      <button aria-label={`Reset zoom, current zoom ${formatZoomPercent(zoom)}`} className="zoom-value" onClick={onResetZoom} title="Reset zoom" type="button">
        <RotateCcw size={14} />
        {formatZoomPercent(zoom)}
      </button>
      <button aria-label="Zoom in" className="zoom-button" onClick={onZoomIn} title="Zoom in" type="button">
        <ZoomIn size={17} />
      </button>
    </div>
  );
}
