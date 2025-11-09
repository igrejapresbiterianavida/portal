// ============================================
// SERVICE-WORKER.JS - PWA Offline Support
// ============================================

const CACHE_NAME = 'ipv-online-v2';
const CACHE_ESTATICO = 'ipv-estatico-v2';
const CACHE_DINAMICO = 'ipv-dinamico-v2';

// Detectar base path automaticamente
const getBasePath = () => {
  const path = self.location.pathname;
  console.log('[Service Worker] Detectando base path. Location:', self.location.href);
  if (path.includes('/portal/')) {
    console.log('[Service Worker] GitHub Pages detectado - usando /portal');
    return '/portal';
  }
  console.log('[Service Worker] Localhost detectado - sem base path');
  return '';
};

const BASE_PATH = getBasePath();

const urlsParaCachear = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/globais.css`,
  `${BASE_PATH}/css/componentes.css`,
  `${BASE_PATH}/css/animacoes.css`,
  `${BASE_PATH}/css/mobile.css`,
  `${BASE_PATH}/css/desktop.css`,
  `${BASE_PATH}/js/config.js`,
  `${BASE_PATH}/js/aplicacao.js`,
  `${BASE_PATH}/js/acessibilidade.js`,
  `${BASE_PATH}/js/interface.js`,
  `${BASE_PATH}/js/api-integracao.js`,
  `${BASE_PATH}/js/auth.js`,
  `${BASE_PATH}/assets/images/logo.svg`,
  `${BASE_PATH}/assets/images/logo-branco.svg`,
  `${BASE_PATH}/manifest.json`
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
    // Se for uma navegação para uma página HTML, ajustar o caminho
    if (request.mode === 'navigate') {
      evento.respondWith(handleNavigation(request));
    } else {
      evento.respondWith(cacheFirst(request));
    }
  } else {
    evento.respondWith(networkFirst(request));
  }
});

// Lidar com navegação de páginas
async function handleNavigation(request) {
  try {
    // Tentar buscar a página normalmente primeiro
    const response = await fetch(request);
    return response;
  } catch (erro) {
    // Se falhar, tentar o cache ou redirecionar para index
    const cache = await caches.open(CACHE_ESTATICO);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback para index.html
    const indexCached = await cache.match(`${BASE_PATH}/index.html`);
    if (indexCached) {
      return indexCached;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Estratégia: Cache First (arquivos estáticos)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_ESTATICO);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
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
