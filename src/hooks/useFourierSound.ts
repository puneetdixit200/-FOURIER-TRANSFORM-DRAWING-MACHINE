"use client";

import { useEffect, useRef } from "react";
import type { FourierComponent } from "@/utils/dft";

type Voice = {
  oscillator: OscillatorNode;
  gain: GainNode;
};

export function useFourierSound(
  enabled: boolean,
  playing: boolean,
  components: FourierComponent[],
  speed: number,
) {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const voicesRef = useRef<Voice[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = playing ? 0.08 : 0;
    master.connect(context.destination);
    contextRef.current = context;
    masterRef.current = master;

    voicesRef.current = components
      .filter((component) => component.frequency !== 0)
      .slice(0, 10)
      .map((component, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index % 3 === 0 ? "triangle" : "sine";
        oscillator.frequency.value = 90 + Math.abs(component.frequency) * 38 * speed;
        gain.gain.value = Math.min(0.04, component.amplitude / 9000);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start();
        return { oscillator, gain };
      });

    void context.resume();

    return () => {
      voicesRef.current.forEach((voice) => voice.oscillator.stop());
      voicesRef.current = [];
      void context.close();
      contextRef.current = null;
      masterRef.current = null;
    };
  }, [enabled, components, speed, playing]);

  useEffect(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) {
      return;
    }

    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.linearRampToValueAtTime(playing ? 0.08 : 0, context.currentTime + 0.12);
  }, [playing]);
}

