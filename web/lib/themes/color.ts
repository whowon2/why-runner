export type Rgba = [r: number, g: number, b: number, a: number];

let ctx: CanvasRenderingContext2D | null = null;

/**
 * Any CSS color (hex, oklch, …) as 8-bit sRGB, via a 1×1 canvas so the
 * browser does the color-space conversion. Browser-only; null if unparsable.
 */
export function toRgba(color: string): Rgba | null {
  if (!ctx) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
  }
  // An invalid value leaves fillStyle unchanged: detect it with two sentinels.
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  const first = ctx.fillStyle;
  ctx.fillStyle = "#fff";
  ctx.fillStyle = color;
  if (first !== ctx.fillStyle) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/** `a` blended over `b` by `amount` (0 = b, 1 = a), opaque. */
export function mix(a: Rgba, b: Rgba, amount: number): Rgba {
  return [
    Math.round(a[0] * amount + b[0] * (1 - amount)),
    Math.round(a[1] * amount + b[1] * (1 - amount)),
    Math.round(a[2] * amount + b[2] * (1 - amount)),
    1,
  ];
}

/** `#rrggbb`, or `#rrggbbaa` with `alpha` (0–1). */
export function toHex([r, g, b]: Rgba, alpha?: number): string {
  const parts = alpha === undefined ? [r, g, b] : [r, g, b, alpha * 255];
  return `#${parts.map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
}
