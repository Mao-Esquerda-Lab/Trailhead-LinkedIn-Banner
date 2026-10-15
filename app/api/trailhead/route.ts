import { NextResponse } from "next/server";
import { parseProfileHtml } from "@/lib/trailhead/parse";
import { parseUsername, profileUrl } from "@/lib/trailhead/username";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("user") ?? "";
  const username = parseUsername(input);
  if (!username) {
    return NextResponse.json({ error: "invalid_user", message: "Informe um username ou URL de trailblazer.me/id/..." }, { status: 400 });
  }
  let res: Response;
  try {
    res = await fetch(profileUrl(username), {
      headers: { "user-agent": "Mozilla/5.0 (compatible; TrailheadBannerBot/0.1)", accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "unreachable", message: "Não foi possível acessar o Trailhead agora." }, { status: 502 });
  }
  if (res.status === 404) {
    return NextResponse.json({ error: "not_found", message: "Perfil não encontrado." }, { status: 404 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "upstream", message: `Trailhead respondeu ${res.status}.` }, { status: 502 });
  }
  const profile = parseProfileHtml(await res.text(), username);
  return NextResponse.json(profile);
}
