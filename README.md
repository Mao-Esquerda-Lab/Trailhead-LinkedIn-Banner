# Trailhead LinkedIn Banner

Gera um banner de LinkedIn (1584×396 PNG) com selos, badges Agentforce e certificações do Trailhead. Publicado como site estático no **GitHub Pages**.

- Importa do **perfil público** `salesforce.com/trailblazer/<user>` (ou o link antigo `trailblazer.me/id/<user>`) (sem login). Não existe API oficial; o parser (`lib/trailhead/parse.ts`) é best-effort e pode precisar de ajuste se o Trailhead mudar.
- Fallback manual: escolha certificações do catálogo ou envie a imagem de qualquer selo.
- Como o navegador não pode ler `trailblazer.me` direto (CORS), um **Cloudflare Worker** (`worker/`) faz a busca do perfil e o proxy das imagens.

## Deploy

1. **Worker** (uma vez): `npx wrangler login && npx wrangler deploy --config worker/wrangler.toml`. Ajuste `ALLOWED_ORIGIN` em `worker/wrangler.toml` se o usuário/org do GitHub for outro. Anote a URL (`https://trailhead-banner-proxy.<conta>.workers.dev`).
2. **Variável do repo**: Settings → Secrets and variables → Actions → *Variables* → `NEXT_PUBLIC_WORKER_URL` = URL do Worker.
3. **Pages**: Settings → Pages → Source: *GitHub Actions*.
4. Push na `main` publica em `https://<usuario>.github.io/<repo>/`. Sem a variável, o site funciona só no modo manual.

## Desenvolvimento

```
npm install
npm run dev     # http://localhost:3000 (defina NEXT_PUBLIC_WORKER_URL para importar)
npm test
```
