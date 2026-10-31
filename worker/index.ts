import { parseProfileHtml } from "../lib/trailhead/parse";
import { parseUsername, profileUrl } from "../lib/trailhead/username";

interface Env {
  /** Origin of the GitHub Pages site, e.g. https://mao-esquerda-lab.github.io */
  ALLOWED_ORIGIN: string;
}

// Only Salesforce / Trailhead CDNs; keeps /img from becoming an open proxy (SSRF).
const IMG_HOSTS = [/(^|\.)salesforce\.com$/, /(^|\.)trailhead\.com$/, /(^|\.)trailblazer\.me$/, /(^|\.)force\.com$/, /(^|\.)forceusercontent\.com$/, /^res\.cloudinary\.com$/];

function cors(env: Env): Record<string, string> {
  return { "access-control-allow-origin": env.ALLOWED_ORIGIN, vary: "origin" };
}

function json(env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(env), "content-type": "application/json" } });
}

async function profile(req: Request, env: Env): Promise<Response> {
  const username = parseUsername(new URL(req.url).searchParams.get("user") ?? "");
  if (!username) return json(env, { error: "invalid_user", message: "Informe um username ou URL de salesforce.com/trailblazer/..." }, 400);
  let res: Response;
  try {
    res = await fetch(profileUrl(username), {
      headers: { "user-agent": "Mozilla/5.0 (compatible; TrailheadBannerBot/0.1)", accept: "text/html" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return json(env, { error: "unreachable", message: "Não foi possível acessar o Trailhead agora." }, 502);
  }
  if (res.status === 404) return json(env, { error: "not_found", message: "Perfil não encontrado." }, 404);
  if (!res.ok) return json(env, { error: "upstream", message: `Trailhead respondeu ${res.status}.` }, 502);
  return json(env, parseProfileHtml(await res.text(), username));
}

async function img(req: Request, env: Env): Promise<Response> {
  let u: URL;
  try {
    u = new URL(new URL(req.url).searchParams.get("url") ?? "");
  } catch {
    return new Response("bad url", { status: 400, headers: cors(env) });
  }
  if (u.protocol !== "https:" || !IMG_HOSTS.some((r) => r.test(u.hostname))) {
    return new Response("host not allowed", { status: 403, headers: cors(env) });
  }
  const up = await fetch(u, { redirect: "error", signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const type = up?.headers.get("content-type") ?? "";
  if (!up?.ok || !type.startsWith("image/")) return new Response("upstream error", { status: 502, headers: cors(env) });
  return new Response(up.body, { headers: { ...cors(env), "content-type": type, "cache-control": "public, max-age=86400" } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors(env), "access-control-allow-methods": "GET" } });
    if (req.method !== "GET") return new Response("method not allowed", { status: 405 });
    const path = new URL(req.url).pathname;
    if (path === "/profile") return profile(req, env);
    if (path === "/img") return img(req, env);
    return new Response("not found", { status: 404, headers: cors(env) });
  },
};
