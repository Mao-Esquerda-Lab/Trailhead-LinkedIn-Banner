import type { ItemKind, TrailItem } from "./types";

/**
 * Snippet the user runs in the DevTools console of their own (rendered) Trailblazer
 * profile page. It walks the DOM (including shadow roots) in document order, tracking
 * the last heading, and copies every <img> with a label as JSON.
 */
export const CONSOLE_SNIPPET = `(()=>{const out=[],seen=new Set();let sec="";
const walk=(r)=>{for(const el of r.querySelectorAll("*")){
if(/^H[1-6]$/.test(el.tagName)||el.getAttribute("role")==="heading"){const t=(el.textContent||"").trim();if(t&&t.length<80)sec=t}
if(el.tagName==="IMG"){const src=el.currentSrc||el.src;const title=(el.alt||el.title||el.getAttribute("aria-label")||"").trim();
if(src&&/^https?:/.test(src)&&title&&!seen.has(src)){seen.add(src);out.push({title,imageUrl:src,section:sec})}}
if(el.shadowRoot)walk(el.shadowRoot)}};
walk(document);copy(JSON.stringify(out));console.log(out.length+" imagens copiadas")})()`;

interface Raw {
  title?: unknown;
  imageUrl?: unknown;
  section?: unknown;
}

const JUNK = /logo|sprite|avatar|placeholder/i;

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function classifyScraped(title: string, section: string): ItemKind {
  if (/certif/i.test(section)) return "certification";
  if (/agentforce/i.test(title) || /agentforce/i.test(section)) return "agentforce";
  return "badge";
}

/** Parses the JSON pasted from the console snippet. Throws on invalid input. */
export function parseScrapedJson(text: string): TrailItem[] {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("Formato inválido: esperado uma lista.");
  const seen = new Map<string, TrailItem>();
  for (const r of data as Raw[]) {
    if (typeof r?.title !== "string" || typeof r?.imageUrl !== "string") continue;
    if (!/^https?:\/\//i.test(r.imageUrl) || JUNK.test(r.imageUrl) || JUNK.test(r.title)) continue;
    const section = typeof r.section === "string" ? r.section : "";
    const kind = classifyScraped(r.title, section);
    const id = `${kind}-${slug(r.title)}`;
    if (!seen.has(id)) seen.set(id, { id, kind, title: r.title.trim(), imageUrl: r.imageUrl });
  }
  return [...seen.values()];
}
