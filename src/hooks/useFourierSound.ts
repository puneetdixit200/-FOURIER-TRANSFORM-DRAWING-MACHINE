"use client";

import { useEffect, useRef } from "react";
import type { FourierComponent } from "@/utils/dft";

type Voice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
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
  const delayRef = useRef<DelayNode | null>(null);
  const feedbackRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!enabled) {
      window.__FOURIER_SOUND_STATE__ = { active: false, voices: 0, state: "off" };
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const delay = context.createDelay(1.2);
    const feedback = context.createGain();
    const wet = context.createGain();
    master.gain.value = playing ? 0.12 : 0;
    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.36;
    wet.gain.value = 0.22;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(compressor);
    master.connect(compressor);
    compressor.connect(context.destination);
    contextRef.current = context;
    masterRef.current = master;
    delayRef.current = delay;
    feedbackRef.current = feedback;

    voicesRef.current = components
      .filter((component) => component.frequency !== 0)
      .slice(0, 18)
      .map((component, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const panner = context.createStereoPanner();
        oscillator.type = index % 4 === 0 ? "triangle" : index % 4 === 1 ? "sine" : "sawtooth";
        oscillator.frequency.value = 74 + Math.abs(component.frequency) * 31 * speed;
        oscillator.detune.value = (component.phase / Math.PI) * 18;
        gain.gain.value = Math.min(0.026, component.amplitude / 13000);
        panner.pan.value = Math.sin(component.phase + index) * 0.72;
        oscillator.connect(gain);
        gain.connect(panner);
        panner.connect(master);
        panner.connect(delay);
        oscillator.start();
        return { oscillator, gain, panner };
      });

    window.__FOURIER_SOUND_STATE__ = {
      active: true,
      voices: voicesRef.current.length,
      state: context.state,
    };
    void context.resume();

    return () => {
      voicesRef.current.forEach((voice) => voice.oscillator.stop());
      voicesRef.current = [];
      void context.close();
      contextRef.current = null;
      masterRef.current = null;
      delayRef.current = null;
      feedbackRef.current = null;
      window.__FOURIER_SOUND_STATE__ = { active: false, voices: 0, state: "closed" };
    };
  }, [enabled, components, speed, playing]);

  useEffect(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) {
      return;
    }

    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.linearRampToValueAtTime(playing ? 0.12 : 0, context.currentTime + 0.18);
    window.__FOURIER_SOUND_STATE__ = {
      active: Boolean(playing),
      voices: voicesRef.current.length,
      state: context.state,
    };
  }, [playing]);
}
