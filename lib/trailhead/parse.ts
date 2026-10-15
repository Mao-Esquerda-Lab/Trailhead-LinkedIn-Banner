import type { ItemKind, TrailItem, TrailProfile } from "./types";

/**
 * Best-effort parser for the public Trailblazer profile page.
 * Trailhead has no official API, so everything fragile lives here.
 * It looks for (1) JSON blobs embedded in the HTML and (2) <img> tags
 * pointing at badge / certification artwork.
 */

const IMG_RE = /<img\b[^>]*>/gi;

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"|\\b${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? decodeEntities(m[1] ?? m[2]) : undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function classify(title: string, imageUrl: string): ItemKind | null {
  const hay = `${title} ${imageUrl}`.toLowerCase();
  if (/certif|credential|\/credentials?\//.test(hay)) return "certification";
  if (/agentforce|agent force/.test(hay)) return "agentforce";
  if (/badge|\/trailhead\/(modules|projects|superbadges)\//.test(hay)) return "badge";
  return null;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fromImages(html: string): TrailItem[] {
  const out: TrailItem[] = [];
  for (const tag of html.match(IMG_RE) ?? []) {
    const src = attr(tag, "src") ?? attr(tag, "data-src");
    const alt = attr(tag, "alt") ?? attr(tag, "title");
    if (!src || !alt || !/^https?:\/\//i.test(src)) continue;
    const kind = classify(alt, src);
    if (!kind) continue;
    out.push({ id: `${kind}-${slug(alt)}`, kind, title: alt.trim(), imageUrl: src });
  }
  return out;
}

function walk(node: unknown, visit: (o: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
  else if (node && typeof node === "object") {
    visit(node as Record<string, unknown>);
    Object.values(node).forEach((n) => walk(n, visit));
  }
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

function fromJson(html: string): TrailItem[] {
  const out: TrailItem[] = [];
  const scripts = html.match(/<script[^>]*type="application\/(?:ld\+)?json"[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const s of scripts) {
    const body = s.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      continue;
    }
    walk(data, (o) => {
      const title = str(o.Title) ?? str(o.title) ?? str(o.name) ?? str(o.Name);
      const img = str(o.ImageUrl) ?? str(o.imageUrl) ?? str(o.image) ?? str(o.IconUrl);
      if (!title || !img || !/^https?:\/\//i.test(img)) return;
      const kind = classify(title, img);
      if (!kind) return;
      out.push({ id: `${kind}-${slug(title)}`, kind, title, imageUrl: img, url: str(o.Url) ?? str(o.url) });
    });
  }
  return out;
}

export function parseProfileHtml(html: string, username: string): TrailProfile {
  const seen = new Map<string, TrailItem>();
  for (const it of [...fromJson(html), ...fromImages(html)]) if (!seen.has(it.id)) seen.set(it.id, it);
  const name = decodeEntities(html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)?.[1] ?? "")
    .replace(/\s*\|.*$/, "")
    .trim();
  const avatarUrl = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i)?.[1];
  return { username, name: name || undefined, avatarUrl, items: [...seen.values()] };
}
