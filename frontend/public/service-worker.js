const CACHE_NAME = 'linkflow-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/robots.txt',
  '/sitemap.xml'
];

// Instalação do Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Força o novo Service Worker a se tornar ativo imediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Ativação do Service Worker - Limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Garante que o service worker controle todos os clientes imediatamente
  );
});

// Intercepta as requisições
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Evita interceptar requisições para a API do Firebase ou outras APIs externas/métodos não GET
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Estratégia Network-First para a página principal (HTML/Rotas de navegação)
  // Isso garante que o index.html seja sempre buscado na rede se estiver online,
  // evitando que arquivos JS antigos (com hashes antigos) sejam carregados a partir de um index.html em cache.
  const isHtmlRequest = e.request.mode === 'navigate' || 
                        url.pathname === '/' || 
                        url.pathname === '/index.html';

  if (isHtmlRequest) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // Salva uma cópia atualizada do HTML no cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se estiver offline, retorna do cache
          return caches.match(e.request);
        })
    );
  } else {
    // Para outros recursos estáticos (JS, CSS, imagens), usa Cache-First
    // Como os arquivos JS/CSS do Vite possuem hashes no nome, eles nunca mudam.
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(e.request).then((response) => {
          // Não cacheia respostas que não sejam de sucesso (ex: 404 de arquivos inexistentes)
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cacheia novos recursos estáticos
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});
