const HOSTS = new Set(["trailblazer.me", "www.trailblazer.me"]);
const USER_RE = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

/** Accepts a bare username or a trailblazer.me/id/<user> URL. Returns null if invalid. */
export function parseUsername(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.includes("/")) {
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      return null;
    }
    if (!HOSTS.has(url.hostname.toLowerCase())) return null;
    const m = url.pathname.match(/^\/(?:id|profile)\/([^/]+)\/?$/i);
    if (!m) return null;
    return USER_RE.test(m[1]) ? m[1] : null;
  }
  return USER_RE.test(raw) ? raw : null;
}

export function profileUrl(username: string): string {
  return `https://www.trailblazer.me/id/${encodeURIComponent(username)}`;
}
