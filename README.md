# Trailhead LinkedIn Banner

Gera um banner de LinkedIn (1584×396 PNG) com selos, badges Agentforce e certificações do Trailhead.

- Importa do **perfil público** `trailblazer.me/id/<user>` (sem login). Não existe API oficial; o parser (`lib/trailhead/parse.ts`) é best-effort e pode precisar de ajuste se o Trailhead mudar.
- Fallback manual: escolha certificações do catálogo ou envie a imagem de qualquer selo.

```
npm install
npm run dev     # http://localhost:3000
npm test
```
