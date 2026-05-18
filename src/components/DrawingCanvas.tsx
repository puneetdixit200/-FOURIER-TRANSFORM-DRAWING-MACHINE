"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { computeDFT, sortByAmplitude, type FourierComponent } from "@/utils/dft";
import type { Point } from "@/utils/complex";
import type { RenderMode } from "./ControlPanel";

type BattleEntry = {
  name: string;
  points: Point[];
  components: FourierComponent[];
  score: number;
};

type DrawingCanvasProps = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  mode: RenderMode;
  sourcePath: Point[];
  components: FourierComponent[];
  battle: { a?: BattleEntry; b?: BattleEntry };
  epicycleCount: number;
  speed: number;
  playing: boolean;
  drawingEnabled: boolean;
  showCircles: boolean;
  showLines: boolean;
  teachMode: boolean;
  zoom: number;
  resetToken: number;
  onDrawingComplete: (points: Point[]) => void;
};

const TAU = Math.PI * 2;

const colors = {
  raw: "#00f0ff",
  trail: "#ff2d7b",
  trailB: "#7cff6b",
  radius: "rgba(255, 226, 92, 0.78)",
  circle: "rgba(122, 220, 255, 0.72)",
  circleFill: "rgba(0, 240, 255, 0.045)",
};

function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  origin: Point,
  stroke: string,
  width: number,
  glow = 0,
  zoom = 1,
) {
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(origin.x + points[0].x * zoom, origin.y + points[0].y * zoom);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    ctx.quadraticCurveTo(
      origin.x + current.x * zoom,
      origin.y + current.y * zoom,
      origin.x + ((current.x + next.x) / 2) * zoom,
      origin.y + ((current.y + next.y) / 2) * zoom,
    );
  }

  const last = points[points.length - 1];
  ctx.lineTo(origin.x + last.x * zoom, origin.y + last.y * zoom);
  ctx.stroke();
  ctx.restore();
}

function drawScreenPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  stroke: string,
  width: number,
  glow = 0,
) {
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.shadowColor = stroke;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function drawEpicycleChain(
  ctx: CanvasRenderingContext2D,
  components: FourierComponent[],
  origin: Point,
  time: number,
  count: number,
  options: {
    showCircles: boolean;
    showLines: boolean;
    rotate?: boolean;
    lineColor?: string;
    circleColor?: string;
    zoom?: number;
  },
) {
  let center = { ...origin };
  const max = Math.min(count, components.length);
  const zoom = options.zoom ?? 1;

  for (let index = 0; index < max; index += 1) {
    const component = components[index];
    const angle = component.frequency * time + component.phase;
    const radius = component.amplitude * zoom;
    const rawVector = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
    const vector = options.rotate
      ? { x: -rawVector.y, y: rawVector.x }
      : rawVector;
    const next = {
      x: center.x + vector.x,
      y: center.y + vector.y,
    };

    if (options.showCircles && radius > 0.4) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, TAU);
      ctx.fillStyle = colors.circleFill;
      ctx.strokeStyle = options.circleColor ?? colors.circle;
      ctx.lineWidth = 1.35;
      ctx.shadowColor = options.circleColor ?? colors.circle;
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (options.showLines) {
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(next.x, next.y);
      ctx.strokeStyle = options.lineColor ?? colors.radius;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = options.lineColor ?? colors.radius;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    center = next;
  }

  return center;
}

function addInterpolatedPoint(points: Point[], next: Point) {
  const previous = points[points.length - 1];
  if (!previous) {
    points.push(next);
    return;
  }

  const distance = Math.hypot(next.x - previous.x, next.y - previous.y);
  const steps = Math.max(1, Math.ceil(distance / 4));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    points.push({
      x: previous.x + (next.x - previous.x) * t,
      y: previous.y + (next.y - previous.y) * t,
    });
  }
}

export function DrawingCanvas({
  canvasRef,
  mode,
  sourcePath,
  components,
  battle,
  epicycleCount,
  speed,
  playing,
  drawingEnabled,
  showCircles,
  showLines,
  teachMode,
  zoom,
  resetToken,
  onDrawingComplete,
}: DrawingCanvasProps) {
  const [draftPath, setDraftPath] = useState<Point[]>([]);
  const draftRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const timeRef = useRef(0);
  const trailRef = useRef<Point[]>([]);
  const dualTrailRef = useRef<Point[]>([]);
  const battleTrailRef = useRef<{ a: Point[]; b: Point[] }>({ a: [], b: [] });

  const xComponents = useMemo(
    () => sortByAmplitude(computeDFT(sourcePath.map((point) => ({ re: point.x, im: 0 })))),
    [sourcePath],
  );
  const yComponents = useMemo(
    () => sortByAmplitude(computeDFT(sourcePath.map((point) => ({ re: point.y, im: 0 })))),
    [sourcePath],
  );

  useEffect(() => {
    timeRef.current = 0;
    trailRef.current = [];
    dualTrailRef.current = [];
    battleTrailRef.current = { a: [], b: [] };
  }, [resetToken, sourcePath, components, mode, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let frameId = 0;
    let previous = performance.now();

    const render = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.floor(rect.width * dpr));
      const pixelHeight = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const delta = Math.min(48, now - previous);
      previous = now;

      const previousTime = timeRef.current;
      if (playing && !isDrawingRef.current && components.length > 0) {
        timeRef.current = (timeRef.current + (delta / 7600) * TAU * speed) % TAU;
        if (timeRef.current < previousTime) {
          trailRef.current = [];
          dualTrailRef.current = [];
          battleTrailRef.current = { a: [], b: [] };
        }
      }

      const center = { x: rect.width / 2, y: rect.height / 2 };
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.028)";
      for (let x = -80; x < rect.width + 80; x += 80) {
        ctx.fillRect(x, 0, 1, rect.height);
      }
      for (let y = -80; y < rect.height + 80; y += 80) {
        ctx.fillRect(0, y, rect.width, 1);
      }
      ctx.restore();

      if (sourcePath.length > 1) {
        drawSmoothPath(ctx, sourcePath, center, "rgba(0,240,255,0.28)", 2, 12, zoom);
      }

      if (mode === "dual" && sourcePath.length > 1) {
        const topOrigin = { x: rect.width / 2, y: Math.max(96, rect.height * 0.15) };
        const leftOrigin = { x: Math.max(96, rect.width * 0.13), y: rect.height / 2 };
        const xTip = drawEpicycleChain(ctx, xComponents, topOrigin, timeRef.current, epicycleCount, {
          showCircles,
          showLines,
          zoom,
          circleColor: "rgba(71, 211, 255, 0.72)",
          lineColor: "rgba(255, 232, 92, 0.76)",
        });
        const yTip = drawEpicycleChain(ctx, yComponents, leftOrigin, timeRef.current, epicycleCount, {
          showCircles,
          showLines,
          rotate: true,
          zoom,
          circleColor: "rgba(255, 111, 170, 0.72)",
          lineColor: "rgba(124, 255, 107, 0.76)",
        });
        const projection = { x: xTip.x, y: yTip.y };
        ctx.setLineDash([5, 8]);
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        ctx.moveTo(xTip.x, xTip.y);
        ctx.lineTo(projection.x, projection.y);
        ctx.lineTo(yTip.x, yTip.y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (playing) {
          dualTrailRef.current.push(projection);
          dualTrailRef.current = dualTrailRef.current.slice(-1800);
        }
        drawScreenPath(ctx, dualTrailRef.current, colors.trail, 3, 16);
      } else if (mode === "battle" && (battle.a || battle.b)) {
        const entries: Array<["a" | "b", BattleEntry | undefined, Point, string]> = [
          ["a", battle.a, { x: rect.width * 0.33, y: rect.height / 2 }, colors.trail],
          ["b", battle.b, { x: rect.width * 0.67, y: rect.height / 2 }, colors.trailB],
        ];
        entries.forEach(([slot, entry, origin, color]) => {
          if (!entry) {
            return;
          }
          drawSmoothPath(ctx, entry.points, origin, `${color}33`, 2, 8, zoom);
          const tip = drawEpicycleChain(ctx, entry.components, origin, timeRef.current, epicycleCount, {
            showCircles,
            showLines,
            zoom,
            circleColor: `${color}55`,
            lineColor: `${color}44`,
          });
          if (playing) {
            battleTrailRef.current[slot].push(tip);
            battleTrailRef.current[slot] = battleTrailRef.current[slot].slice(-1800);
          }
          drawScreenPath(ctx, battleTrailRef.current[slot], color, 3, 14);
          ctx.fillStyle = "rgba(255,255,255,0.72)";
          ctx.font = "600 13px var(--font-mono)";
          ctx.fillText(`${entry.name}: ${entry.score} circles`, origin.x - 70, rect.height - 40);
        });
      } else if (components.length > 0) {
        const tip = drawEpicycleChain(ctx, components, center, timeRef.current, epicycleCount, {
          showCircles,
          showLines,
          zoom,
        });
        if (playing && !isDrawingRef.current) {
          trailRef.current.push(tip);
          trailRef.current = trailRef.current.slice(-2400);
        }
        drawScreenPath(ctx, trailRef.current, colors.trail, 3, 18);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4.5, 0, TAU);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = colors.trail;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (draftPath.length > 1) {
        drawSmoothPath(ctx, draftPath, center, colors.raw, 4, 22, zoom);
      }

      if (teachMode) {
        const strongest = components[0];
        ctx.save();
        ctx.fillStyle = "rgba(10,10,15,0.72)";
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 1;
        ctx.roundRect(rect.width - 330, 28, 292, 118, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e9fbff";
        ctx.font = "700 13px var(--font-mono)";
        ctx.fillText("Teach mode", rect.width - 306, 58);
        ctx.font = "12px var(--font-sans)";
        ctx.fillStyle = "rgba(233,251,255,0.78)";
        ctx.fillText(`Largest circle radius: ${strongest ? strongest.amplitude.toFixed(1) : "0"}`, rect.width - 306, 84);
        ctx.fillText(`Frequency: ${strongest ? strongest.frequency : 0}`, rect.width - 306, 106);
        ctx.fillText("More epicycles add corners, loops, and tiny wiggles.", rect.width - 306, 128);
        ctx.restore();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [
    battle,
    canvasRef,
    components,
    draftPath,
    epicycleCount,
    mode,
    playing,
    showCircles,
    showLines,
    sourcePath,
    speed,
    teachMode,
    xComponents,
    yComponents,
    zoom,
  ]);

  const pointerToPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (event.clientX - rect.left - rect.width / 2) / zoom,
      y: (event.clientY - rect.top - rect.height / 2) / zoom,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingEnabled) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerToPoint(event);
    draftRef.current = [point];
    setDraftPath([point]);
    isDrawingRef.current = true;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingEnabled || !isDrawingRef.current) {
      return;
    }
    event.preventDefault();
    const points = [...draftRef.current];
    addInterpolatedPoint(points, pointerToPoint(event));
    draftRef.current = points;
    setDraftPath(points);
  };

  const finishDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return;
    }
    event.preventDefault();
    isDrawingRef.current = false;
    const completed = draftRef.current;
    if (completed.length > 4) {
      window.setTimeout(() => {
        onDrawingComplete(completed);
        draftRef.current = [];
        setDraftPath([]);
      }, 500);
    }
  };

  return (
    <canvas
      className={drawingEnabled ? "drawing-canvas is-drawing" : "drawing-canvas"}
      onPointerCancel={finishDrawing}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrawing}
      ref={canvasRef}
    />
  );
}
