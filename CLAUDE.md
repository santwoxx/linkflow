# LinkFlowAI — Guia do Projeto

> **LEIA ESTE ARQUIVO ANTES DE QUALQUER ALTERAÇÃO.** Ele define a arquitetura,
> as regras invioláveis e o checklist de verificação. Nenhuma mudança deve
> quebrar funcionalidade existente.

## O que é o sistema

SaaS brasileiro de "link na bio" (alternativa ao Linktree) + rede social +
marketplace de serviços freelancer. Produção: `https://linkflowai.com.br`.
Todo o texto voltado ao usuário é em **português (pt-BR)**.

## Arquitetura

```
frontend/   React 19 + Vite 6 + Tailwind CSS 4 (@tailwindcss/vite) + Firebase JS SDK
backend/    Express 4 + firebase-admin + Gemini (@google/genai) — SEO/sitemap/e-mail
```

- **Sem react-router**: o roteamento é manual em `frontend/src/App.tsx` via
  `window.location.pathname` / query params (`?u=`, `?view=`, `?pro=`, `?raffle=`).
  Slugs de usuário são servidos em `/{username}`; caminhos reservados estão na
  lista `reservedPaths` em App.tsx.
- **Estado**: apenas `useState`/`useEffect` + Firestore `onSnapshot`. Não há
  Redux/Zustand — não introduzir.
- **Estilo**: Tailwind utility-first inline nos componentes + utilitários
  customizados em `frontend/src/index.css`. Não existe styled-components/CSS modules.
- **Animações**: biblioteca `motion` (`motion/react`) + keyframes CSS em index.css.
- **Ícones**: `lucide-react` (imports nomeados, tree-shaken).
- **Tipos**: centralizados em `frontend/src/types.ts` (UserProfile, LinkItem,
  UserTheme, AVAILABLE_THEMES, ADMIN_EMAIL…).

### Componentes principais (frontend/src/components)

| Componente | Papel |
|---|---|
| `App.tsx` | Roteamento manual, auth, SEO dinâmico (meta tags/JSON-LD), landing page |
| `Dashboard.tsx` | Shell logado com abas: feed, links, discover, professional, raffles, admin, stats, design |
| `PublicProfile.tsx` | Página pública do usuário (renderiza temas/layouts) — caminho mais acessado por visitantes |
| `LinkEditor.tsx` | CRUD de links (tipos: link, whatsapp, scheduling, pix, etc.) |
| `ThemeSelector.tsx` | Editor de temas/aparência (aba design) |
| `StatsView.tsx` | Métricas (cliques, views, leads) |
| `CommunityFeed.tsx` | Rede social (posts, likes, comentários) |
| `AdminPanel.tsx` | Painel do CEO (somente `ADMIN_EMAIL`) |

### Backend (Render.com — `render.yaml`)

- `/api/health`, `/api/gemini/generate` (IA), `/api/send-resume` (nodemailer)
- `/seo/:username` (páginas pré-renderizadas p/ crawlers) e `/sitemap.xml`
- Rate-limit em `/api` (100 req/15min) e rotas SEO (60/min, bots liberados).
- Respostas com gzip via middleware `compression` (registrado logo após o helmet).

## Comandos

```bash
# Frontend (em frontend/)
npm run dev      # vite na porta 3000
npm run lint     # tsc --noEmit  ← RODAR APÓS QUALQUER MUDANÇA NO FRONTEND
npm run build    # build de produção (injeta CACHE_VERSION no service worker)

# Backend (em backend/)
npm run dev      # tsx watch
npm run build    # tsc
```

## Regras invioláveis (NÃO QUEBRAR)

1. **Contas especiais hardcoded** — há lógica específica em App.tsx para
   `ADMIN_EMAIL` (CEO), `camilebezerra92@gmail.com` e usernames
   `wafort`/`wafort24h` (tema premium, verificação forçada, SEO LocalBusiness).
   Também existem perfis mock de fallback (`natanmarinho.dev`,
   `nails_camilebezerra`, `usuario_demo`). Nunca remover/renomear sem pedido explícito.
2. **Modo demo/offline** — o app funciona sem Firestore: fallbacks de
   `localStorage` (`linkflow_cached_profile_*`, `linkflow_demo_profile`,
   `demo_links`) e detecção de erro "offline". Preservar esses caminhos.
3. **Sincronização em tempo real** — a página pública ignora snapshots com
   `metadata.fromCache === true` e usa `getDocsFromServer` no primeiro fetch
   (evita tema/cores obsoletos). Há sync entre abas via
   `BroadcastChannel('linkflow_public_sync')` + evento
   `linkflow_public_sync_local`. Não trocar por `getDocs` simples.
4. **Imagens em base64 no Firestore** — uploads são comprimidos por
   `utils/image.ts::compressImage` para caber no limite de ~500.000 chars das
   regras do Firestore (alvo 350.000). Não aumentar limites sem ajustar
   `firestore.rules`.
5. **Service worker** — `public/service-worker.js` usa network-first para HTML
   e cache-first validado por MIME para assets. O `CACHE_VERSION` é injetado
   automaticamente no build por `vite.config.ts` (plugin `swVersionPlugin`).
   Nunca cachear assets sem validar Content-Type; nunca fazer fallback de
   asset para index.html.
6. **SEO é receita** — meta tags dinâmicas, JSON-LD e canonical em App.tsx e
   `index.html` são intencionais e detalhados. Alterações precisam manter
   title/description/JSON-LD válidos. Os caminhos SEO
   (`linktree-gratis`, `alternativa-linktree`, `como-colocar-link-na-bio`,
   `plataforma-freelancer`, `contratar-freelancer`) existem em 3 lugares:
   App.tsx (`seoPaths`), SeoLandingPage.tsx e backend — manter em sincronia.
7. **Roteamento manual** — não adicionar react-router. Novas rotas entram no
   parser de URL do App.tsx e na lista `reservedPaths`.
8. **TypeScript sempre limpo** — `npm run lint` (tsc --noEmit) deve terminar
   com 0 erros antes de concluir qualquer tarefa.

## Design system (manter consistência visual)

- **Cor de marca**: violeta `#a78bfa` (hover `#c4b5fd`); secundárias:
  esmeralda (serviços/sucesso), rosa/rose (erros/ban), âmbar (métricas).
- **Fundo padrão**: `#050b18` (app) e cards `#0f172a` com borda
  `border-slate-800/50`, cantos `rounded-2xl`/`rounded-3xl`.
- **Tipografia**: Inter (sans, padrão), fontes de tema carregadas no
  index.html (Outfit, Space Grotesk, Syne, Cinzel, Bebas Neue, Caveat,
  Playfair, JetBrains Mono). Textos de UI são pequenos: `text-xs`/`text-[10px]`.
- **Padrões prontos em index.css**: `.glass`, `.glow-border`, `.card-lift`,
  `.btn-shimmer`, `.animate-in` (+ `-d1..-d5`), `.scale-on-click`,
  `.skeleton-pulse`, `.scrollbar-hide`, animações `anim-*` para botões de links.
  **Reutilizar antes de criar novos.**
- Estados interativos sempre com `transition-all` + `cursor-pointer`;
  acessibilidade: `aria-label` em botões só-ícone, `focus-visible` global já
  definido em index.css.

## Performance (padrões já adotados — seguir)

- Componentes pesados são `React.lazy` + `<React.Suspense>` com
  `LoadingSpinner` como fallback (padrão em App.tsx e Dashboard.tsx).
  Novos módulos grandes (>300 linhas) acessados por aba/rota devem ser lazy.
- `vite.config.ts` define `manualChunks` (react, firebase, motion, icons).
- Fontes carregam de forma não-bloqueante (`media="print"` + onload) e há
  skeleton inline no index.html — não converter para `@import` bloqueante.
- Preferir `getDocs` com `limit()` e listeners com cleanup no `useEffect`.

## Checklist antes de concluir qualquer alteração

1. `cd frontend && npm run lint` → 0 erros.
2. Se mudou algo estrutural: `npm run build` → sucesso.
3. Funcionalidades críticas intactas: login Google, registro de username,
   página pública `/{username}`, modo demo, abas do Dashboard, temas.
4. Texto novo voltado ao usuário está em pt-BR.
5. Nenhuma regra da seção "Regras invioláveis" foi violada.
