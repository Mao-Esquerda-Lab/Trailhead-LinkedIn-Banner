"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CERT_CATALOG } from "@/lib/catalog";
import { BANNER_H, BANNER_W, THEMES, drawBanner, loadImage, proxied } from "@/lib/banner/render";
import type { ItemKind, TrailItem, TrailProfile } from "@/lib/trailhead/types";

const TABS: { kind: ItemKind; label: string }[] = [
  { kind: "badge", label: "Selos" },
  { kind: "agentforce", label: "Agentforce" },
  { kind: "certification", label: "Certificações" },
];

export default function BannerApp() {
  const [user, setUser] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [imported, setImported] = useState<TrailItem[]>([]);
  const [manual, setManual] = useState<TrailItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [tab, setTab] = useState<ItemKind>("certification");
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [headline, setHeadline] = useState("Salesforce Trailblazer");
  const [subtitle, setSubtitle] = useState("Agentforce • Certificações • Trailhead");
  const [guide, setGuide] = useState(true);
  const [images, setImages] = useState<Map<string, HTMLImageElement | null>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const all = useMemo(() => {
    const m = new Map<string, TrailItem>();
    for (const it of [...imported, ...manual, ...CERT_CATALOG]) if (!m.has(it.id)) m.set(it.id, it);
    return m;
  }, [imported, manual]);
  const chosen = selected.map((id) => all.get(id)).filter((x): x is TrailItem => !!x);
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  async function connect() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(`/api/trailhead?user=${encodeURIComponent(user)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Falha ao importar.");
      const p = data as TrailProfile;
      setImported(p.items);
      if (p.name) setHeadline(p.name);
      if (!p.items.length) {
        setStatus("error");
        setError("Perfil encontrado, mas nenhum selo foi detectado (o perfil é público?). Adicione manualmente abaixo.");
        return;
      }
      setStatus("idle");
      setSelected(p.items.filter((i) => i.kind !== "badge").slice(0, 10).map((i) => i.id));
    } catch (e) {
      setStatus("error");
      setError(`${(e as Error).message} Você pode adicionar itens manualmente.`);
    }
  }

  function addManual(file: File, kind: ItemKind, title: string) {
    const url = URL.createObjectURL(file);
    const item: TrailItem = { id: `manual-${Date.now()}`, kind, title, imageUrl: url };
    setManual((m) => [...m, item]);
    setSelected((s) => [...s, item.id]);
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 10 ? s : [...s, id]));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(chosen.map(async (it) => [it.id, await loadImage(it.imageUrl.startsWith("blob:") ? it.imageUrl : proxied(it.imageUrl))] as const));
      if (!cancelled) setImages(new Map(entries));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, all]);

  useEffect(() => {
    if (canvasRef.current) drawBanner(canvasRef.current, { theme, headline, subtitle, items: chosen, images, showGuide: guide });
  }, [theme, headline, subtitle, chosen, images, guide]);

  function download() {
    const c = document.createElement("canvas");
    drawBanner(c, { theme, headline, subtitle, items: chosen, images, showGuide: false });
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "linkedin-banner.png";
      a.click();
    }, "image/png");
  }

  const list = [...all.values()].filter((i) => i.kind === tab && (i.imageUrl || i.kind === "certification" || imported.includes(i) || manual.includes(i)));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-bold">Banner de LinkedIn com Trailhead</h1>

      <section className="space-y-2 rounded-lg bg-white p-4 shadow">
        <h2 className="font-semibold">1. Conectar perfil</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="username ou https://www.trailblazer.me/id/seu-usuario" className="flex-1 rounded border px-3 py-2" />
          <button onClick={connect} disabled={!user || status === "loading"} className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50">
            {status === "loading" ? "Importando…" : "Importar"}
          </button>
        </div>
        <p className="text-sm text-slate-500">Seu perfil do Trailblazer precisa estar público. Não pedimos login nem senha.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>

      <section className="space-y-3 rounded-lg bg-white p-4 shadow">
        <h2 className="font-semibold">2. Escolher itens ({selected.length}/10)</h2>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t.kind} onClick={() => setTab(t.kind)} className={`rounded px-3 py-1 text-sm ${tab === t.kind ? "bg-sky-600 text-white" : "bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <ul className="grid max-h-64 grid-cols-1 gap-1 overflow-auto sm:grid-cols-2">
          {list.map((i) => (
            <li key={i.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-slate-50">
                <input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} />
                <span className="text-sm">{i.title}</span>
              </label>
            </li>
          ))}
          {!list.length && <li className="text-sm text-slate-500">Nada aqui ainda. Importe o perfil ou adicione manualmente.</li>}
        </ul>
        <ManualAdd kind={tab} onAdd={addManual} />
      </section>

      <section className="space-y-3 rounded-lg bg-white p-4 shadow">
        <h2 className="font-semibold">3. Personalizar e baixar</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="rounded border px-3 py-2" aria-label="Título" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="rounded border px-3 py-2" aria-label="Subtítulo" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setThemeId(t.id)} className={`rounded px-3 py-1 text-sm ${themeId === t.id ? "bg-sky-600 text-white" : "bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1 text-sm">
            <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} /> guia da foto
          </label>
        </div>
        <canvas ref={canvasRef} width={BANNER_W} height={BANNER_H} className="w-full rounded border" />
        <button onClick={download} className="rounded bg-emerald-600 px-4 py-2 text-white">
          Baixar PNG ({BANNER_W}×{BANNER_H})
        </button>
      </section>
    </main>
  );
}

function ManualAdd({ kind, onAdd }: { kind: ItemKind; onAdd: (f: File, k: ItemKind, title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
      <span className="text-sm text-slate-500">Adicionar manualmente:</span>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do item" className="rounded border px-2 py-1 text-sm" />
      <input
        type="file"
        accept="image/*"
        disabled={!title}
        className="text-sm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onAdd(f, kind, title);
          e.target.value = "";
          setTitle("");
        }}
      />
    </div>
  );
}
