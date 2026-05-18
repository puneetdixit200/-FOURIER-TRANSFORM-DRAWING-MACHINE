"use client";

import { useEffect, useRef } from "react";
import type { FourierComponent } from "@/utils/dft";
import { createFourierVoicePlan } from "@/utils/soundDesign";

type Voice = {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
  send: GainNode;
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
    const lowpass = context.createBiquadFilter();
    const delay = context.createDelay(1.2);
    const feedback = context.createGain();
    const wet = context.createGain();
    master.gain.value = playing ? 0.095 : 0;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1450;
    lowpass.Q.value = 0.7;
    compressor.threshold.value = -28;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.018;
    compressor.release.value = 0.32;
    delay.delayTime.value = 0.42;
    feedback.gain.value = 0.42;
    wet.gain.value = 0.32;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(lowpass);
    master.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(context.destination);
    contextRef.current = context;
    masterRef.current = master;
    delayRef.current = delay;
    feedbackRef.current = feedback;

    voicesRef.current = createFourierVoicePlan(components, speed)
      .map((voicePlan) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const panner = context.createStereoPanner();
        const send = context.createGain();
        oscillator.type = voicePlan.type;
        oscillator.frequency.value = voicePlan.frequency;
        oscillator.detune.value = voicePlan.detune;
        gain.gain.value = voicePlan.gain;
        panner.pan.value = voicePlan.pan;
        send.gain.value = voicePlan.delaySend;
        oscillator.connect(gain);
        gain.connect(panner);
        panner.connect(master);
        panner.connect(send);
        send.connect(delay);
        oscillator.start();
        return { oscillator, gain, panner, send };
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
    master.gain.linearRampToValueAtTime(playing ? 0.095 : 0, context.currentTime + 0.32);
    window.__FOURIER_SOUND_STATE__ = {
      active: Boolean(playing),
      voices: voicesRef.current.length,
      state: context.state,
    };
  }, [playing]);
}
