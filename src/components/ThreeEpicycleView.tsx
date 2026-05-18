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
  zoom: number;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
};

const TAU = Math.PI * 2;

function makeLine(points: THREE.Vector3[], color: number, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthTest: false,
  });
  return new THREE.Line(geometry, material);
}

function makeCircle(radius: number, center: THREE.Vector3, color: number, opacity = 0.72) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index <= 72; index += 1) {
    const angle = (TAU * index) / 72;
    points.push(new THREE.Vector3(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius, center.z));
  }
  return makeLine(points, color, opacity);
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
  zoom,
  onCanvasReady,
}: ThreeEpicycleViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.0009);
    const camera = new THREE.PerspectiveCamera(48, 1, 1, 3000);
    camera.position.set(0, 0, 620);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x05050a, 1);
    host.appendChild(renderer.domElement);
    onCanvasReady(renderer.domElement);

    const epicycleGroup = new THREE.Group();
    const trailGroup = new THREE.Group();
    scene.add(epicycleGroup, trailGroup);

    const sourcePoints = sourcePath.map(
      (point, index) =>
        new THREE.Vector3(
          point.x * zoom,
          -point.y * zoom,
          Math.sin((index / Math.max(1, sourcePath.length)) * TAU) * 64 * zoom,
        ),
    );
    const sourceLine = makeLine(sourcePoints, 0x00f0ff, 0.82);
    scene.add(sourceLine);

    const starField = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 320 }, () => new THREE.Vector3((Math.random() - 0.5) * 1800, (Math.random() - 0.5) * 1200, -Math.random() * 1000)),
      ),
      new THREE.PointsMaterial({ color: 0x89eaff, size: 1.8, transparent: true, opacity: 0.45 }),
    );
    scene.add(starField);

    const endpoint = new THREE.Mesh(
      new THREE.SphereGeometry(7, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    scene.add(endpoint);

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
        const radius = component.amplitude * zoom;
        const vector = new THREE.Vector3(
          Math.cos(angle) * radius,
          -Math.sin(angle) * radius,
          Math.sin(angle * 0.6 + component.frequency) * radius * 0.22,
        );
        const next = center.clone().add(vector);

        if (showCircles && radius > 0.4) {
          epicycleGroup.add(makeCircle(radius, center, 0x79dcff, 0.7));
        }
        if (showLines) {
          epicycleGroup.add(makeLine([center, next], 0xffe25c, 0.95));
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
        trailGroup.add(makeLine(trail, 0xff2d7b, 1));
      }

      endpoint.position.copy(center);
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
  }, [components, epicycleCount, onCanvasReady, playing, showCircles, showLines, sourcePath, speed, zoom]);

  return <div className="three-stage" ref={hostRef} />;
}
