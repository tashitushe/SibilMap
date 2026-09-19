import maplibregl from "maplibre-gl";
import { buildStyle, type Layers } from "./mapStyle";
import { FONTS, THEMES, type PaperSize } from "./themes";

/** Logical poster width in CSS px. Everything is laid out in units u = W/100. */
export const W = 1000;
export const U = W / 10 / 10; // 10px per unit
export const MARGIN = 5 * U;
export const TEXT_FRACTION = 0.18;

export interface PosterConfig {
  city: string;
  country: string;
  tagline: string;
  coords: string;
  themeId: string;
  fontId: string;
  sizeId: string;
  landscape: boolean;
  border: "none" | "thin" | "thick";
  caption: boolean; // wallpapers only
  showText: boolean; // print posters: text block under the map
  layers: Layers;
}

export interface View { center: [number, number]; zoom: number; }

export const isWallpaper = (size: PaperSize) => !!size.px;

export function posterHeight(size: PaperSize, landscape: boolean) {
  const r = size.h / size.w;
  return Math.round(W * (landscape && !size.px ? 1 / r : r));
}

export function mapRect(h: number, size?: PaperSize, showText = true) {
  if (size && isWallpaper(size)) return { x: 0, y: 0, w: W, h };
  if (!showText) return { x: MARGIN, y: MARGIN, w: W - 2 * MARGIN, h: h - 2 * MARGIN };
  return { x: MARGIN, y: MARGIN, w: W - 2 * MARGIN, h: h - MARGIN - h * TEXT_FRACTION };
}

export function cityFontSize(city: string) {
  return Math.min(9 * U, (80 * U) / Math.max(city.length * 0.75, 1));
}

export const themeOf = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const fontOf = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0];

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  chars.forEach((c, i) => { ctx.fillText(c, x, y); x += widths[i] + spacing; });
}

/** Wallpapers: full-bleed map with an optional small caption plate. */
function drawCaptionPlate(ctx: CanvasRenderingContext2D, cfg: PosterConfig, H: number) {
  if (!cfg.caption) return;
  const theme = themeOf(cfg.themeId);
  const font = fontOf(cfg.fontId);
  const cs = Math.min(5 * U, (50 * U) / Math.max(cfg.city.length * 0.75, 1));
  const cy = 1.7 * U;
  ctx.font = `${font.weight} ${cs}px "${font.family}"`;
  const spacing = cs * 0.18;
  const textW = [...cfg.city.toUpperCase()].reduce((a, c) => a + ctx.measureText(c).width + spacing, 0);
  const pw = Math.max(textW, 20 * U) + 8 * U;
  const ph = cs + cy + 6 * U;
  const bottom = H - Math.max(5 * U, H * 0.08);
  const x = W / 2 - pw / 2, y = bottom - ph;
  ctx.fillStyle = theme.bg;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.roundRect(x, y, pw, ph, 1.5 * U);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.text;
  ctx.textBaseline = "alphabetic";
  drawSpaced(ctx, cfg.city.toUpperCase(), W / 2, y + 2.8 * U + cs * 0.8, spacing);
  ctx.font = `500 ${cy}px "DM Sans"`;
  drawSpaced(ctx, cfg.country.toUpperCase(), W / 2, y + ph - 1.8 * U, cy * 0.45);
}

/** Border + typography. Shared by the live preview overlay and the exporter. */
export function drawDecor(ctx: CanvasRenderingContext2D, cfg: PosterConfig, size: PaperSize, H: number) {
  const theme = themeOf(cfg.themeId);
  const font = fontOf(cfg.fontId);
  if (isWallpaper(size)) return drawCaptionPlate(ctx, cfg, H);
  const r = mapRect(H, size, cfg.showText);
  if (cfg.border !== "none") {
    ctx.strokeStyle = theme.text;
    ctx.lineWidth = cfg.border === "thin" ? 0.25 * U : 0.7 * U;
    const i = 2 * U;
    ctx.strokeRect(i, i, W - 2 * i, H - 2 * i);
  }

  if (!cfg.showText) return;
  const ty = r.y + r.h;
  const th = H - 5 * U - ty; // keep the text block inside the frame
  ctx.fillStyle = theme.text;
  ctx.textBaseline = "alphabetic";
  const cs = cityFontSize(cfg.city);
  ctx.font = `${font.weight} ${cs}px "${font.family}"`;
  drawSpaced(ctx, cfg.city.toUpperCase(), W / 2, ty + th * 0.4, cs * 0.18);
  ctx.font = `500 ${2.4 * U}px "DM Sans"`;
  drawSpaced(ctx, cfg.country.toUpperCase(), W / 2, ty + th * 0.6, 2.4 * U * 0.45);
  ctx.globalAlpha = 0.7;
  ctx.font = `400 ${1.7 * U}px "DM Sans"`;
  drawSpaced(ctx, cfg.tagline, W / 2, ty + th * 0.77, 1.7 * U * 0.15);
  ctx.font = `400 ${1.5 * U}px "DM Sans"`;
  drawSpaced(ctx, cfg.coords, W / 2, ty + th * 0.94, 1.5 * U * 0.2);
  ctx.globalAlpha = 1;
}

export async function exportPoster(cfg: PosterConfig, size: PaperSize, view: View, outWidth: number) {
  const outW = size.px ? size.px[0] : outWidth;
  const scale = outW / W;
  const H = posterHeight(size, cfg.landscape);
  const r = mapRect(H, size, cfg.showText);
  const theme = themeOf(cfg.themeId);
  const font = fontOf(cfg.fontId);
  await Promise.all([
    document.fonts.load(`${font.weight} 40px "${font.family}"`),
    document.fonts.load(`400 20px "DM Sans"`),
  ]);

  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${r.w}px;height:${r.h}px`;
  document.body.appendChild(host);
  const map = new maplibregl.Map({
    container: host,
    style: buildStyle(theme, cfg.layers),
    center: view.center,
    zoom: view.zoom,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    pixelRatio: scale,
    canvasContextAttributes: { preserveDrawingBuffer: true },
  });
  try {
    await new Promise<void>((res, rej) => {
      const t = setTimeout(() => rej(new Error("Map took too long to load")), 45000);
      map.once("idle", () => { clearTimeout(t); res(); });
      map.once("error", (e) => { clearTimeout(t); rej(e.error); });
    });

    const c = document.createElement("canvas");
    c.width = Math.round(W * scale);
    c.height = size.px ? size.px[1] : Math.round(H * scale);
    const ctx = c.getContext("2d")!;
    ctx.scale(c.width / W, c.height / H);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(map.getCanvas(), r.x, r.y, r.w, r.h);

    drawDecor(ctx, cfg, size, H);

    return await new Promise<Blob>((res, rej) =>
      c.toBlob((b) => (b ? res(b) : rej(new Error("Export failed"))), "image/png"),
    );
  } finally {
    map.remove();
    host.remove();
  }
}
