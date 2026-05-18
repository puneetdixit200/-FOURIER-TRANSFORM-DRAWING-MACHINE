# Fourier Transform Drawing Machine

Interactive Next.js app that turns drawings, presets, SVG paths, webcam edge traces, and battle-mode sketches into Fourier epicycle animations.

## Features

- Freehand mouse and touch drawing with interpolated pointer capture.
- Custom DFT engine for epicycle reconstruction.
- Presets: Pi, infinity, star, heart, and treble clef.
- Dual-axis 3Blue1Brown-style view.
- Three.js 3D epicycle mode.
- SVG paste/upload import.
- Webcam edge tracing.
- Sound mode with Web Audio oscillators mapped to Fourier components.
- Battle mode scoring by reconstruction difficulty.
- Amplitude spectrum visualization.
- GIF and MP4/WebM canvas export.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test:run
npm run lint
npm run build
npm run test:e2e -- tests/smoke.spec.ts --reporter=list --workers=1
```

