// ─────────────────────────────────────────────────────────────────────────────
// LinkFlowAI Service Worker
// Estratégia: Network-First para HTML/navegação + Cache-First SEGURO para assets
//
// PROBLEMA CORRIGIDO: assets com hash (JS/CSS do Vite) não devem nunca ser
// servidos de um cache que contém o arquivo de um build anterior. O SW agora
// valida o Content-Type antes de cacheár, e NUNCA faz fallback de assets para
// index.html (o que causava o erro "MIME type text/html" no console).
// ─────────────────────────────────────────────────────────────────────────────

// Bump esta versão a CADA DEPLOY para forçar re-instalação e limpeza de cache.
const CACHE_VERSION = 'linkflow-v6';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const HTML_CACHE    = `${CACHE_VERSION}-html`;

// Apenas estes arquivos previsíveis são pré-cacheados na instalação.
// Arquivos de assets (JS/CSS com hash) SÃO CACHEADOS ON-DEMAND, não aqui.
const PRECACHE_URLS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna true se a URL é um asset estático do Vite (tem hash no nome). */
function isViteAsset(url) {
  return url.pathname.startsWith('/assets/');
}

/** Retorna true se é uma request de navegação (carrega uma página HTML). */
function isNavigationRequest(request, url) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

/** Retorna true se a resposta tem um Content-Type válido para o que foi pedido. */
function hasValidMime(response, url) {
  const ct = response.headers.get('content-type') || '';
  if (url.pathname.endsWith('.css'))  return ct.includes('text/css');
  if (url.pathname.endsWith('.js'))   return ct.includes('javascript') || ct.includes('wasm');
  if (url.pathname.endsWith('.json')) return ct.includes('json');
  return true; // para outros tipos (imagens, fontes etc.) não verificar
}

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // skipWaiting força o novo SW a ativar imediatamente,
  // garantindo que o cache antigo seja limpo antes da página carregar assets.
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          // Deleta TODOS os caches que não são do CACHE_VERSION atual.
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => {
            console.log('[SW] Deletando cache antigo:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Ignorar requisições não-GET e externas (Firebase, APIs, CDNs etc.)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // 2. Assets do Vite (/assets/*.js, /assets/*.css) — Cache-First ESTRITO
  //    - Se encontrado no cache E com MIME correto → cache
  //    - Se não encontrado → rede; só cacheia se MIME for correto
  //    - NUNCA faz fallback para index.html
  if (isViteAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          // Valida o MIME do que está cacheado (defesa extra)
          if (hasValidMime(cached, url)) return cached;
          // MIME inválido no cache → deleta e busca da rede
          await cache.delete(event.request);
        }

        try {
          const networkResponse = await fetch(event.request);
          // Só cacheia se 200 e MIME correto
          if (networkResponse.ok && hasValidMime(networkResponse, url)) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // Offline e sem cache → retorna erro limpo (não index.html!)
          return new Response('Asset não disponível offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })
    );
    return;
  }

  // 3. Navegação HTML (SPA routes) — Network-First
  //    - Sempre tenta rede primeiro para pegar o index.html mais recente
  //    - Fallback para cache HTML apenas se offline
  if (isNavigationRequest(event.request, url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(HTML_CACHE).then((c) => c.put('/index.html', clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html', { cacheName: HTML_CACHE });
          return cached || new Response('Offline — sem conexão.', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 4. Outros recursos estáticos (ícones, manifest, robots, etc.) — Stale-While-Revalidate
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
