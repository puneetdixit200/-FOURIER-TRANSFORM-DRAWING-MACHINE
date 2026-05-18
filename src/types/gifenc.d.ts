declare module "gifenc" {
  type Palette = number[][];

  export function quantize(data: Uint8ClampedArray, maxColors: number): Palette;
  export function applyPalette(data: Uint8ClampedArray, palette: Palette): Uint8Array;
  export function GIFEncoder(): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options: { palette: Palette; delay: number },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  };
}

