"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  BadgeHelp,
  Box,
  Camera,
  Circle,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileUp,
  Film,
  GalleryHorizontalEnd,
  InfinityIcon,
  Maximize2,
  Music,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Swords,
  Upload,
  Wand2,
} from "lucide-react";
import { PresetGallery } from "./PresetGallery";
import { SpectrumView } from "./SpectrumView";
import type { FourierComponent } from "@/utils/dft";

export type RenderMode = "classic" | "dual" | "battle" | "three";

export type BattleSummary = {
  a?: { name: string; score: number };
  b?: { name: string; score: number };
};

type ControlPanelProps = {
  drawingName: string;
  activePreset?: string;
  mode: RenderMode;
  playing: boolean;
  drawingEnabled: boolean;
  showCircles: boolean;
  showLines: boolean;
  soundEnabled: boolean;
  teachMode: boolean;
  speed: number;
  epicycleCount: number;
  maxEpicycles: number;
  components: FourierComponent[];
  svgText: string;
  battle: BattleSummary;
  webcamActive: boolean;
  webcamStatus: string;
  recording: boolean;
  recordingDurationSeconds: number;
  onModeChange: (mode: RenderMode) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onClear: () => void;
  onDraw: () => void;
  onToggleCircles: () => void;
  onToggleLines: () => void;
  onToggleSound: () => void;
  onToggleTeach: () => void;
  onSpeedChange: (speed: number) => void;
  onEpicycleChange: (count: number) => void;
  onPresetSelect: (id: string) => void;
  onSvgTextChange: (value: string) => void;
  onLoadSvg: () => void;
  onSvgFile: (file: File) => void;
  onStartWebcam: () => void;
  onCaptureWebcam: () => void;
  onSaveBattleSlot: (slot: "a" | "b") => void;
  onExportVideo: () => void;
  onExportGif: () => void;
  onRecordingDurationChange: (seconds: number) => void;
};

type DashboardSize = {
  width: number;
  height: number;
};

const MIN_PANEL_WIDTH = 300;
const MIN_PANEL_HEIGHT = 320;

export function ControlPanel({
  drawingName,
  activePreset,
  mode,
  playing,
  drawingEnabled,
  showCircles,
  showLines,
  soundEnabled,
  teachMode,
  speed,
  epicycleCount,
  maxEpicycles,
  components,
  svgText,
  battle,
  webcamActive,
  webcamStatus,
  recording,
  recordingDurationSeconds,
  onModeChange,
  onTogglePlay,
  onReset,
  onClear,
  onDraw,
  onToggleCircles,
  onToggleLines,
  onToggleSound,
  onToggleTeach,
  onSpeedChange,
  onEpicycleChange,
  onPresetSelect,
  onSvgTextChange,
  onLoadSvg,
  onSvgFile,
  onStartWebcam,
  onCaptureWebcam,
  onSaveBattleSlot,
  onExportVideo,
  onExportGif,
  onRecordingDurationChange,
}: ControlPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef({ dx: 0, dy: 0 });
  const resizeRef = useRef({ height: 0, startX: 0, startY: 0, width: 0 });
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null);
  const [panelSize, setPanelSize] = useState<DashboardSize | null>(null);
  const winner =
    battle.a && battle.b
      ? battle.a.score === battle.b.score
        ? "Tie"
        : battle.a.score < battle.b.score
          ? "Player A"
          : "Player B"
      : "Waiting";

  const panelStyle: CSSProperties | undefined =
    panelPosition || panelSize
      ? {
          ...(panelPosition ? { bottom: "auto", left: panelPosition.x, top: panelPosition.y } : {}),
          ...(panelSize ? { height: panelSize.height, maxHeight: "none", width: panelSize.width } : {}),
        }
      : undefined;

  const clampPanelSize = (width: number, height: number): DashboardSize => {
    const rect = panelRef.current?.getBoundingClientRect();
    const left = rect?.left ?? 8;
    const top = rect?.top ?? 8;
    const maxWidth = Math.max(220, window.innerWidth - left - 8);
    const maxHeight = Math.max(260, window.innerHeight - top - 8);
    const minWidth = Math.min(MIN_PANEL_WIDTH, maxWidth);
    const minHeight = Math.min(MIN_PANEL_HEIGHT, maxHeight);
    return {
      height: Math.min(Math.max(minHeight, height), maxHeight),
      width: Math.min(Math.max(minWidth, width), maxWidth),
    };
  };

  const movePanel = (x: number, y: number) => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 390;
    const height = panel?.offsetHeight ?? 520;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const maxY = Math.max(8, window.innerHeight - Math.min(height, window.innerHeight - 16) - 8);
    setPanelPosition({
      x: Math.min(maxX, Math.max(8, x)),
      y: Math.min(maxY, Math.max(8, y)),
    });
  };

  const startPanelDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    movePanel(rect.left, rect.top);
  };

  const handlePanelDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    movePanel(event.clientX - dragRef.current.dx, event.clientY - dragRef.current.dy);
  };

  const startPanelResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = panel.getBoundingClientRect();
    resizeRef.current = {
      height: rect.height,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanelPosition({ x: rect.left, y: rect.top });
    setPanelSize(clampPanelSize(rect.width, rect.height));
  };

  const handlePanelResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setPanelSize(
      clampPanelSize(
        resizeRef.current.width + event.clientX - resizeRef.current.startX,
        resizeRef.current.height + event.clientY - resizeRef.current.startY,
      ),
    );
  };

  return (
    <aside className="control-panel" ref={panelRef} style={panelStyle}>
      <div
        className="panel-header panel-drag-handle"
        onPointerDown={startPanelDrag}
        onPointerMove={handlePanelDrag}
      >
        <div>
          <p className="eyebrow">Fourier Drawing Machine</p>
          <h1>{drawingName}</h1>
        </div>
        <button className="draw-button pulse" onClick={onDraw} title="Draw your own" type="button">
          <PenLine size={18} />
          Draw
        </button>
      </div>

      <div className="button-row">
        <button className="primary-button" onClick={onTogglePlay} type="button">
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? "Pause" : "Play"}
        </button>
        <button className="icon-button" onClick={onReset} title="Reset animation" type="button">
          <RotateCcw size={17} />
        </button>
        <button className="icon-button" onClick={onClear} title="Clear and redraw" type="button">
          <Eraser size={17} />
        </button>
      </div>

      <div className="mode-grid">
        <button
          className={mode === "classic" ? "mode-button is-active" : "mode-button"}
          onClick={() => onModeChange("classic")}
          type="button"
        >
          <Circle size={15} />
          Epicycles
        </button>
        <button
          className={mode === "dual" ? "mode-button is-active" : "mode-button"}
          onClick={() => onModeChange("dual")}
          type="button"
        >
          <InfinityIcon size={15} />
          Dual-axis
        </button>
        <button
          className={mode === "battle" ? "mode-button is-active" : "mode-button"}
          onClick={() => onModeChange("battle")}
          type="button"
        >
          <Swords size={15} />
          Battle
        </button>
        <button
          className={mode === "three" ? "mode-button is-active" : "mode-button"}
          onClick={() => onModeChange("three")}
          type="button"
        >
          <Box size={15} />
          3D
        </button>
      </div>

      <label className="range-field">
        <span>
          Epicycles <b>{epicycleCount}</b>
        </span>
        <input
          max={Math.max(1, maxEpicycles)}
          min={1}
          onChange={(event) => onEpicycleChange(Number(event.target.value))}
          type="range"
          value={Math.min(epicycleCount, Math.max(1, maxEpicycles))}
        />
      </label>

      <label className="range-field">
        <span>
          Speed <b>{speed.toFixed(2)}x</b>
        </span>
        <input
          max={4}
          min={0.25}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          step={0.05}
          type="range"
          value={speed}
        />
      </label>

      <div className="toggle-grid">
        <button className={showCircles ? "toggle is-on" : "toggle"} onClick={onToggleCircles} type="button">
          {showCircles ? <Eye size={15} /> : <EyeOff size={15} />}
          Circles
        </button>
        <button className={showLines ? "toggle is-on" : "toggle"} onClick={onToggleLines} type="button">
          <Wand2 size={15} />
          Lines
        </button>
        <button className={soundEnabled ? "toggle is-on" : "toggle"} onClick={onToggleSound} type="button">
          <Music size={15} />
          Sound
        </button>
        <button className={teachMode ? "toggle is-on" : "toggle"} onClick={onToggleTeach} type="button">
          <BadgeHelp size={15} />
          Teach
        </button>
      </div>

      <section className="panel-section">
        <div className="section-title">
          <GalleryHorizontalEnd size={15} />
          Presets
        </div>
        <PresetGallery activeId={activePreset} onSelect={onPresetSelect} />
      </section>

      <section className="panel-section">
        <div className="section-title">
          <Upload size={15} />
          SVG import
        </div>
        <textarea
          className="svg-input"
          onChange={(event) => onSvgTextChange(event.target.value)}
          placeholder="<svg> or M 0 0 C ..."
          value={svgText}
        />
        <div className="button-row">
          <button className="small-button" onClick={onLoadSvg} type="button">
            <FileUp size={15} />
            Load
          </button>
          <label className="small-button file-label">
            <input
              accept=".svg,image/svg+xml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onSvgFile(file);
                }
                event.currentTarget.value = "";
              }}
              type="file"
            />
            <Upload size={15} />
            File
          </label>
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <Camera size={15} />
          Webcam trace
        </div>
        <div className="button-row">
          <button className="small-button" onClick={onStartWebcam} type="button">
            <Camera size={15} />
            {webcamActive ? "Live" : "Start"}
          </button>
          <button className="small-button" disabled={!webcamActive} onClick={onCaptureWebcam} type="button">
            <Wand2 size={15} />
            Capture
          </button>
        </div>
        <p className="mini-status">{webcamStatus}</p>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <Swords size={15} />
          Battle mode
        </div>
        <div className="button-row">
          <button className="small-button" onClick={() => onSaveBattleSlot("a")} type="button">
            Save A
          </button>
          <button className="small-button" onClick={() => onSaveBattleSlot("b")} type="button">
            Save B
          </button>
        </div>
        <div className="battle-score">
          <span>A: {battle.a ? battle.a.score : "-"}</span>
          <span>B: {battle.b ? battle.b.score : "-"}</span>
          <b>{winner}</b>
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <Film size={15} />
          Export
        </div>
        <label className="range-field compact">
          <span>
            Duration <b>{recordingDurationSeconds}s</b>
          </span>
          <input
            aria-label="Recording duration"
            max={30}
            min={2}
            onChange={(event) => onRecordingDurationChange(Number(event.target.value))}
            step={1}
            type="range"
            value={recordingDurationSeconds}
          />
        </label>
        <div className="button-row">
          <button className="small-button" disabled={recording} onClick={onExportVideo} type="button">
            <Download size={15} />
            MP4/WebM
          </button>
          <button className="small-button" disabled={recording} onClick={onExportGif} type="button">
            <Download size={15} />
            GIF
          </button>
        </div>
      </section>

      <SpectrumView components={components} />

      {drawingEnabled ? <p className="draw-status">Draw on the canvas.</p> : null}
      {recording ? <p className="draw-status">Recording export...</p> : null}
      <button
        aria-label="Resize dashboard"
        className="dashboard-resize-handle"
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerDown={startPanelResize}
        onPointerMove={handlePanelResize}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        title="Resize dashboard"
        type="button"
      >
        <Maximize2 size={13} />
      </button>
    </aside>
  );
}
