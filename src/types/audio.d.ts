interface Window {
  webkitAudioContext: typeof AudioContext;
  __FOURIER_SOUND_STATE__?: {
    active: boolean;
    voices: number;
    state: string;
  };
}
