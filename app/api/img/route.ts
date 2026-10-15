import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Only Salesforce / Trailhead CDNs; prevents this from becoming an open proxy (SSRF).
const ALLOWED = [/(^|\.)salesforce\.com$/, /(^|\.)trailhead\.com$/, /(^|\.)trailblazer\.me$/, /(^|\.)force\.com$/, /(^|\.)forceusercontent\.com$/];

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url");
  let u: URL;
  try {
    u = new URL(raw ?? "");
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (u.protocol !== "https:" || !ALLOWED.some((r) => r.test(u.hostname))) {
    return new NextResponse("host not allowed", { status: 403 });
  }
  const up = await fetch(u, { redirect: "error", signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const type = up?.headers.get("content-type") ?? "";
  if (!up?.ok || !type.startsWith("image/")) return new NextResponse("upstream error", { status: 502 });
  return new NextResponse(up.body, { headers: { "content-type": type, "cache-control": "public, max-age=86400" } });
}
