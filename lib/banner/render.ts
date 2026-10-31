import { WORKER_URL } from "../config";
import type { TrailItem } from "../trailhead/types";

export const BANNER_W = 1584;
export const BANNER_H = 396;
/** LinkedIn overlays the profile photo on the bottom-left; keep content right of this. */
export const SAFE_LEFT = 480;

export interface Theme {
  id: string;
  label: string;
  bg: [string, string];
  fg: string;
  muted: string;
  card: string;
}

export const THEMES: Theme[] = [
  { id: "salesforce", label: "Salesforce", bg: ["#032d60", "#0176d3"], fg: "#ffffff", muted: "#c9e4ff", card: "rgba(255,255,255,0.12)" },
  { id: "dark", label: "Escuro", bg: ["#0f172a", "#1e293b"], fg: "#f8fafc", muted: "#94a3b8", card: "rgba(255,255,255,0.08)" },
  { id: "light", label: "Claro", bg: ["#f8fafc", "#e0f2fe"], fg: "#0f172a", muted: "#475569", card: "rgba(15,23,42,0.06)" },
];

export interface BannerOptions {
  theme: Theme;
  headline: string;
  subtitle: string;
  items: TrailItem[];
  images: Map<string, HTMLImageElement | null>;
  showGuide?: boolean;
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Route remote artwork through our proxy so the canvas stays untainted. */
export function proxied(src: string): string {
  return src.startsWith("http") && WORKER_URL ? `${WORKER_URL}/img?url=${encodeURIComponent(src)}` : src;
}

function initials(title: string): string {
  return title
    .replace(/^salesforce certified /i, "")
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function drawBanner(canvas: HTMLCanvasElement, o: BannerOptions): void {
  canvas.width = BANNER_W;
  canvas.height = BANNER_H;
  const ctx = canvas.getContext("2d")!;
  const { theme: t } = o;

  const g = ctx.createLinearGradient(0, 0, BANNER_W, BANNER_H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(1, t.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, BANNER_W, BANNER_H);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = t.fg;
  ctx.font = "700 44px system-ui, sans-serif";
  const left = SAFE_LEFT;
  ctx.fillText(o.headline, left, 80, BANNER_W - left - 60);
  ctx.fillStyle = t.muted;
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(o.subtitle, left, 118, BANNER_W - left - 60);

  const items = o.items.slice(0, 10);
  if (items.length) {
    const area = { x: left, y: 150, w: BANNER_W - left - 60, h: BANNER_H - 150 - 30 };
    const perRow = items.length > 5 ? Math.ceil(items.length / 2) : items.length;
    const rows = Math.ceil(items.length / perRow);
    const gap = 20;
    const size = Math.min(110, (area.w - gap * (perRow - 1)) / perRow, (area.h - gap * (rows - 1)) / rows);
    items.forEach((it, i) => {
      const r = Math.floor(i / perRow);
      const c = i % perRow;
      const inRow = r === rows - 1 ? items.length - r * perRow : perRow;
      const rowW = inRow * size + (inRow - 1) * gap;
      const x = area.x + (area.w - rowW) / 2 + c * (size + gap);
      const y = area.y + r * (size + gap);
      const img = o.images.get(it.id);
      if (img) {
        ctx.drawImage(img, x, y, size, size);
      } else {
        ctx.fillStyle = t.card;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = t.fg;
        ctx.textAlign = "center";
        ctx.font = `700 ${Math.round(size * 0.28)}px system-ui, sans-serif`;
        ctx.fillText(initials(it.title), x + size / 2, y + size / 2 + size * 0.1);
        ctx.font = `400 ${Math.max(11, Math.round(size * 0.1))}px system-ui, sans-serif`;
        ctx.fillStyle = t.muted;
        ctx.fillText(it.kind === "certification" ? "CERT" : it.kind === "agentforce" ? "AGENTFORCE" : "BADGE", x + size / 2, y + size / 2 + size * 0.28);
        ctx.textAlign = "left";
      }
    });
  }

  if (o.showGuide) {
    ctx.strokeStyle = "rgba(255,0,80,0.8)";
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(0, 0, SAFE_LEFT, BANNER_H);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,0,80,0.9)";
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.fillText("área da foto de perfil (não aparece no PNG)", 16, 28);
  }
}

