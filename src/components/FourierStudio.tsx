"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ControlPanel, type RenderMode } from "./ControlPanel";
import { DrawingCanvas } from "./DrawingCanvas";
import { drawingDifficulty, prepareDrawing, type PreparedDrawing } from "./FourierEngine";
import { ThreeEpicycleView } from "./ThreeEpicycleView";
import { useFourierSound } from "@/hooks/useFourierSound";
import type { Point } from "@/utils/complex";
import { getPreset } from "@/utils/presets";
import { extractSvgPathData, sampleSvgPath } from "@/utils/svgPath";
import { extractEdgeTrace } from "@/utils/webcamTrace";

type BattleEntry = {
  name: string;
  points: Point[];
  components: PreparedDrawing["components"];
  score: number;
};

const emptyDrawing: PreparedDrawing = {
  points: [],
  components: [],
  maxEpicycles: 1,
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function FourierStudio() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Prevent server/client canvas markup drift for the purely interactive studio.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="studio-shell">
        <div className="studio-loader">Fourier Drawing Machine</div>
      </main>
    );
  }

  return <FourierStudioClient />;
}

function FourierStudioClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const initializedRef = useRef(false);

  const [viewport, setViewport] = useState({ width: 1200, height: 760 });
  const [drawing, setDrawing] = useState<PreparedDrawing>(emptyDrawing);
  const [drawingName, setDrawingName] = useState("Pi preset");
  const [activePreset, setActivePreset] = useState<string | undefined>("pi");
  const [mode, setMode] = useState<RenderMode>("classic");
  const [playing, setPlaying] = useState(true);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [showCircles, setShowCircles] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [teachMode, setTeachMode] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [epicycleCount, setEpicycleCount] = useState(160);
  const [resetToken, setResetToken] = useState(0);
  const [svgText, setSvgText] = useState("");
  const [webcamActive, setWebcamActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [battle, setBattle] = useState<{ a?: BattleEntry; b?: BattleEntry }>({});

  useFourierSound(soundEnabled, playing, drawing.components, speed);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const loadPoints = useCallback(
    (points: Point[], name: string, options: { fit?: boolean; presetId?: string } = {}) => {
      const nextDrawing = prepareDrawing(points, viewport, { fit: options.fit ?? true, sampleCount: 512 });
      setDrawing(nextDrawing);
      setDrawingName(name);
      setActivePreset(options.presetId);
      setEpicycleCount(Math.min(180, Math.max(1, nextDrawing.maxEpicycles)));
      setPlaying(true);
      setDrawingEnabled(false);
      setResetToken((value) => value + 1);
    },
    [viewport],
  );

  useEffect(() => {
    if (!initializedRef.current && viewport.width > 0) {
      initializedRef.current = true;
      const preset = getPreset("pi");
      loadPoints(preset.points, `${preset.name} preset`, { presetId: preset.id });
    }
  }, [loadPoints, viewport.width]);

  useEffect(() => {
    if (mode !== "three") {
      activeCanvasRef.current = canvasRef.current;
    }
  }, [mode]);

  const handlePresetSelect = (id: string) => {
    const preset = getPreset(id);
    loadPoints(preset.points, `${preset.name} preset`, { presetId: preset.id });
  };

  const handleDrawingComplete = (points: Point[]) => {
    loadPoints(points, "Custom drawing", { fit: false });
  };

  const clearAndDraw = () => {
    setDrawing(emptyDrawing);
    setDrawingName("New drawing");
    setActivePreset(undefined);
    setBattle({});
    setDrawingEnabled(true);
    setPlaying(false);
    setResetToken((value) => value + 1);
  };

  const loadSvg = () => {
    const trimmed = svgText.trim();
    if (!trimmed) {
      return;
    }

    const paths = trimmed.startsWith("<") ? extractSvgPathData(trimmed) : [trimmed];
    const points = paths.flatMap((pathData) => sampleSvgPath(pathData, Math.max(160, Math.floor(512 / paths.length))));
    if (points.length > 2) {
      loadPoints(points, "SVG import");
    }
  };

  const handleSvgFile = async (file: File) => {
    const text = await file.text();
    setSvgText(text);
    const paths = extractSvgPathData(text);
    const points = paths.flatMap((pathData) => sampleSvgPath(pathData, Math.max(160, Math.floor(512 / Math.max(1, paths.length)))));
    if (points.length > 2) {
      loadPoints(points, file.name.replace(/\.svg$/i, ""));
    }
  };

  const startWebcam = async () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
      setWebcamActive(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });
    webcamStreamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    setWebcamActive(true);
  };

  const captureWebcam = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return;
    }

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = 180;
    captureCanvas.height = 135;
    const ctx = captureCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.translate(captureCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    const trace = extractEdgeTrace(
      ctx.getImageData(0, 0, captureCanvas.width, captureCanvas.height),
      viewport.width * 0.55,
      viewport.height * 0.55,
    );
    if (trace.length > 0) {
      loadPoints(trace, "Webcam trace", { fit: false });
    }
  };

  const saveBattleSlot = (slot: "a" | "b") => {
    if (drawing.points.length === 0 || drawing.components.length === 0) {
      return;
    }

    const entry: BattleEntry = {
      name: slot === "a" ? "Player A" : "Player B",
      points: drawing.points,
      components: drawing.components,
      score: drawingDifficulty(drawing.points, drawing.components),
    };
    setBattle((current) => ({ ...current, [slot]: entry }));
    setMode("battle");
    setResetToken((value) => value + 1);
  };

  const exportVideo = async () => {
    const canvas = activeCanvasRef.current ?? canvasRef.current;
    if (!canvas || !canvas.captureStream) {
      return;
    }

    const mimeTypes = ["video/mp4;codecs=h264", "video/webm;codecs=vp9", "video/webm"];
    const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    setRecording(true);
    recorder.start();
    await wait(6500);
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    stream.getTracks().forEach((track) => track.stop());
    setRecording(false);

    const type = mimeType ?? "video/webm";
    const extension = type.includes("mp4") ? "mp4" : "webm";
    downloadBlob(new Blob(chunks, { type }), `fourier-drawing.${extension}`);
  };

  const exportGif = async () => {
    const canvas = activeCanvasRef.current ?? canvasRef.current;
    if (!canvas) {
      return;
    }

    const { GIFEncoder, applyPalette, quantize } = await import("gifenc");
    const width = 480;
    const height = Math.max(270, Math.round((canvas.height / Math.max(1, canvas.width)) * width));
    const capture = document.createElement("canvas");
    capture.width = width;
    capture.height = height;
    const ctx = capture.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    setRecording(true);
    const gif = GIFEncoder();
    for (let frame = 0; frame < 42; frame += 1) {
      ctx.drawImage(canvas, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, width, height, { palette, delay: 80 });
      await wait(80);
    }
    gif.finish();
    setRecording(false);
    const bytes = gif.bytes();
    const buffer = new Uint8Array(bytes).buffer as ArrayBuffer;
    downloadBlob(new Blob([buffer], { type: "image/gif" }), "fourier-drawing.gif");
  };

  const maxEpicycles = Math.max(1, drawing.maxEpicycles);
  const safeEpicycleCount = Math.min(epicycleCount, maxEpicycles);

  const battleSummary = useMemo(
    () => ({
      a: battle.a ? { name: battle.a.name, score: battle.a.score } : undefined,
      b: battle.b ? { name: battle.b.name, score: battle.b.score } : undefined,
    }),
    [battle],
  );

  return (
    <main className="studio-shell">
      {mode === "three" ? (
        <ThreeEpicycleView
          components={drawing.components}
          epicycleCount={safeEpicycleCount}
          onCanvasReady={(canvas) => {
            activeCanvasRef.current = canvas;
          }}
          playing={playing}
          showCircles={showCircles}
          showLines={showLines}
          sourcePath={drawing.points}
          speed={speed}
        />
      ) : (
        <DrawingCanvas
          battle={battle}
          canvasRef={canvasRef}
          components={drawing.components}
          drawingEnabled={drawingEnabled}
          epicycleCount={safeEpicycleCount}
          mode={mode}
          onDrawingComplete={handleDrawingComplete}
          playing={playing}
          resetToken={resetToken}
          showCircles={showCircles}
          showLines={showLines}
          sourcePath={drawing.points}
          speed={speed}
          teachMode={teachMode}
        />
      )}

      <ControlPanel
        activePreset={activePreset}
        battle={battleSummary}
        components={drawing.components}
        drawingEnabled={drawingEnabled}
        drawingName={drawingName}
        epicycleCount={safeEpicycleCount}
        maxEpicycles={maxEpicycles}
        mode={mode}
        onCaptureWebcam={captureWebcam}
        onClear={clearAndDraw}
        onDraw={() => {
          setDrawingEnabled(true);
          setPlaying(false);
          setActivePreset(undefined);
        }}
        onEpicycleChange={setEpicycleCount}
        onExportGif={exportGif}
        onExportVideo={exportVideo}
        onLoadSvg={loadSvg}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setResetToken((value) => value + 1);
        }}
        onPresetSelect={handlePresetSelect}
        onReset={() => setResetToken((value) => value + 1)}
        onSaveBattleSlot={saveBattleSlot}
        onSpeedChange={setSpeed}
        onStartWebcam={startWebcam}
        onSvgFile={handleSvgFile}
        onSvgTextChange={setSvgText}
        onToggleCircles={() => setShowCircles((value) => !value)}
        onToggleLines={() => setShowLines((value) => !value)}
        onTogglePlay={() => setPlaying((value) => !value)}
        onToggleSound={() => setSoundEnabled((value) => !value)}
        onToggleTeach={() => setTeachMode((value) => !value)}
        playing={playing}
        recording={recording}
        showCircles={showCircles}
        showLines={showLines}
        soundEnabled={soundEnabled}
        speed={speed}
        svgText={svgText}
        teachMode={teachMode}
        webcamActive={webcamActive}
      />

      <video className={webcamActive ? "webcam-video is-active" : "webcam-video"} muted playsInline ref={videoRef} />
      <div className="corner-brand">DFT / Epicycle Lab</div>
    </main>
  );
}
