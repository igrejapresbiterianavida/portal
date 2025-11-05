// ============================================
// SERVICE-WORKER.JS - PWA Offline Support
// ============================================

const CACHE_NAME = 'ipv-online-v1';
const CACHE_ESTATICO = 'ipv-estatico-v1';
const CACHE_DINAMICO = 'ipv-dinamico-v1';

const urlsParaCachear = [
  '/',
  '/index.html',
  '/css/globais.css',
  '/css/componentes.css',
  '/css/animacoes.css',
  '/css/mobile.css',
  '/css/desktop.css',
  '/js/aplicacao.js',
  '/js/acessibilidade.js',
  '/js/interface.js',
  '/js/api-integracao.js',
  '/assets/images/logo.svg',
  '/assets/images/logo-branco.svg',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', evento => {
  console.log('[Service Worker] Instalando...');
  
  evento.waitUntil(
    caches.open(CACHE_ESTATICO).then(cache => {
      console.log('[Service Worker] Cacheando arquivos estáticos');
      return cache.addAll(urlsParaCachear);
    })
  );
  
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', evento => {
  console.log('[Service Worker] Ativando...');
  
  evento.waitUntil(
    caches.keys().then(nomesCaches => {
      return Promise.all(
        nomesCaches.map(nomeCache => {
          if (nomeCache !== CACHE_ESTATICO && nomeCache !== CACHE_DINAMICO) {
            console.log('[Service Worker] Removendo cache antigo:', nomeCache);
            return caches.delete(nomeCache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', evento => {
  const { request } = evento;
  const url = new URL(request.url);
  
  // Apenas cachear requisições do mesmo domínio
  if (url.origin === location.origin) {
    evento.respondWith(cacheFirst(request));
  } else {
    evento.respondWith(networkFirst(request));
  }
});

// Estratégia: Cache First (arquivos estáticos)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_ESTATICO);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (erro) {
    return new Response('Offline', { status: 503 });
  }
}

// Estratégia: Network First (conteúdo dinâmico)
async function networkFirst(request) {
  const cache = await caches.open(CACHE_DINAMICO);
  
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (erro) {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Notificações Push (para futuras implementações)
self.addEventListener('push', evento => {
  const dados = evento.data ? evento.data.json() : {};
  const titulo = dados.titulo || 'IPV Online';
  const opcoes = {
    body: dados.body || 'Nova notificação da igreja',
    icon: '/assets/images/logo.svg',
    badge: '/assets/images/logo.svg',
    vibrate: [200, 100, 200],
    data: {
      url: dados.url || '/'
    }
  };
  
  evento.waitUntil(
    self.registration.showNotification(titulo, opcoes)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  
  evento.waitUntil(
    clients.openWindow(evento.notification.data.url)
  );
});
