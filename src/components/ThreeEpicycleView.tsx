"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FourierComponent } from "@/utils/dft";
import type { Point } from "@/utils/complex";

type ThreeEpicycleViewProps = {
  sourcePath: Point[];
  components: FourierComponent[];
  epicycleCount: number;
  speed: number;
  playing: boolean;
  showCircles: boolean;
  showLines: boolean;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
};

const TAU = Math.PI * 2;

function makeLine(points: THREE.Vector3[], color: number, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Line(geometry, material);
}

function makeCircle(radius: number, center: THREE.Vector3, color: number) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index <= 72; index += 1) {
    const angle = (TAU * index) / 72;
    points.push(new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, center.z));
  }
  return makeLine(points, color, 0.2);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose());
    } else {
      mesh.material?.dispose();
    }
  });
}

export function ThreeEpicycleView({
  sourcePath,
  components,
  epicycleCount,
  speed,
  playing,
  showCircles,
  showLines,
  onCanvasReady,
}: ThreeEpicycleViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x090910, 0.0018);
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 3000);
    camera.position.set(0, 0, 760);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    onCanvasReady(renderer.domElement);

    const epicycleGroup = new THREE.Group();
    const trailGroup = new THREE.Group();
    scene.add(epicycleGroup, trailGroup);

    const sourcePoints = sourcePath.map(
      (point, index) =>
        new THREE.Vector3(point.x, -point.y, Math.sin((index / Math.max(1, sourcePath.length)) * TAU) * 64),
    );
    const sourceLine = makeLine(sourcePoints, 0x00f0ff, 0.28);
    scene.add(sourceLine);

    const starField = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 320 }, () => new THREE.Vector3((Math.random() - 0.5) * 1800, (Math.random() - 0.5) * 1200, -Math.random() * 1000)),
      ),
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, transparent: true, opacity: 0.26 }),
    );
    scene.add(starField);

    let frame = 0;
    let previous = performance.now();
    let time = 0;
    let trail: THREE.Vector3[] = [];

    const resize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    const clearEpicycles = () => {
      [...epicycleGroup.children].forEach((child) => {
        epicycleGroup.remove(child);
        disposeObject(child);
      });
    };

    const render = (now: number) => {
      const delta = Math.min(48, now - previous);
      previous = now;
      if (playing) {
        const before = time;
        time = (time + (delta / 7600) * TAU * speed) % TAU;
        if (time < before) {
          trail = [];
        }
      }

      clearEpicycles();
      let center = new THREE.Vector3(0, 0, 0);
      const max = Math.min(epicycleCount, components.length);

      for (let index = 0; index < max; index += 1) {
        const component = components[index];
        const angle = component.frequency * time + component.phase;
        const vector = new THREE.Vector3(
          Math.cos(angle) * component.amplitude,
          -Math.sin(angle) * component.amplitude,
          Math.sin(angle * 0.6 + component.frequency) * component.amplitude * 0.22,
        );
        const next = center.clone().add(vector);

        if (showCircles && component.amplitude > 0.4) {
          epicycleGroup.add(makeCircle(component.amplitude, center, 0xffffff));
        }
        if (showLines) {
          epicycleGroup.add(makeLine([center, next], 0xffc832, 0.42));
        }
        center = next;
      }

      if (playing) {
        trail.push(center.clone());
        trail = trail.slice(-1600);
      }
      [...trailGroup.children].forEach((child) => {
        trailGroup.remove(child);
        disposeObject(child);
      });
      if (trail.length > 1) {
        trailGroup.add(makeLine(trail, 0xff2d7b, 0.96));
      }

      camera.position.x = Math.sin(time * 0.18) * 220;
      camera.position.y = Math.cos(time * 0.14) * 120;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      onCanvasReady(null);
      scene.traverse(disposeObject);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [components, epicycleCount, onCanvasReady, playing, showCircles, showLines, sourcePath, speed]);

  return <div className="three-stage" ref={hostRef} />;
}

