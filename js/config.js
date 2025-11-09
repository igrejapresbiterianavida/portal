// ============================================
// CONFIG.JS - Configurações da Aplicação
// ============================================

// Detectar caminho base do projeto automaticamente
function detectBasePath() {
  const pathname = window.location.pathname;
  
  // Se estivermos no GitHub Pages (contém '/portal/')
  if (pathname.includes('/portal/')) {
    return '/portal/';
  }
  
  // Se estivermos em localhost ou servidor sem subdiretório
  if (pathname === '/' || pathname.startsWith('/index.html')) {
    return '/';
  }
  
  // Extrair caminho base baseado no pathname atual
  const segments = pathname.split('/').filter(segment => segment !== '');
  
  // Se estamos numa página interna (ex: /projeto/pagina/login.html)
  if (segments.length >= 2 && segments[segments.length - 2] === 'pagina') {
    // Remover 'pagina' e o arquivo para obter o caminho base
    return '/' + segments.slice(0, -2).join('/') + '/';
  }
  
  // Se estamos numa página raiz de subprojeto (ex: /projeto/index.html)
  if (segments.length >= 1 && segments[segments.length - 1].endsWith('.html')) {
    return '/' + segments.slice(0, -1).join('/') + '/';
  }
  
  // Fallback para raiz
  return '/';
}

// Configurações que podem ser públicas
const CONFIG = {
  // Caminho base do projeto (detectado automaticamente)
  BASE_PATH: detectBasePath(),
  
  // URLs de APIs que são públicas
  BIBLE_API_URL: 'https://bible-api.com/data/almeida',
  IPB_RSS_URL: 'https://ipb.org.br/feed/rss',
  
  // Configurações de UI
  MAX_VIDEOS_YOUTUBE: 6,
  CACHE_DURATION: 300000, // 5 minutos
  
  // IDs que não são sensíveis (mas ainda assim melhor usar env)
  get YOUTUBE_API_KEY() {
    return this.getEnvVar('YOUTUBE_API_KEY', '');
  },
  
  get CANAL_ID() {
    return this.getEnvVar('CANAL_ID', '');
  },
  
  get EMAILJS_SERVICE_ID() {
    return this.getEnvVar('EMAILJS_SERVICE_ID', 'service_gmail');
  },
  
  get EMAILJS_TEMPLATE_ID() {
    return this.getEnvVar('EMAILJS_TEMPLATE_ID', 'template_default');
  },
  
  get EMAILJS_PUBLIC_KEY() {
    return this.getEnvVar('EMAILJS_PUBLIC_KEY', '');
  },
  
  get EMAILJS_TO_EMAIL() {
    return this.getEnvVar('EMAILJS_TO_EMAIL', 'ipvida.res.cosmos@gmail.com');
  },
  
  get SUPABASE_URL() {
    return this.getEnvVar('SUPABASE_URL', '');
  },
  
  get SUPABASE_ANON_KEY() {
    return this.getEnvVar('SUPABASE_ANON_KEY', '');
  },
  
  // Método para buscar variáveis de ambiente (funciona em build)
  getEnvVar(name, defaultValue = '') {
    // Em produção, essas variáveis devem ser injetadas no build
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name] || defaultValue;
    }
    
    // Para desenvolvimento local, pode usar um objeto global
    if (typeof window !== 'undefined' && window.ENV) {
      return window.ENV[name] || defaultValue;
    }
    
    // Fallback para desenvolvimento
    console.warn(`Variável de ambiente ${name} não encontrada`);
    return defaultValue;
  },
  
  // Verificar se as configurações estão válidas
  isConfigValid() {
    const required = ['YOUTUBE_API_KEY', 'EMAILJS_PUBLIC_KEY'];
    return required.every(key => this.getEnvVar(key) !== '');
  },
  
  // Construir URL correta baseada no caminho base
  buildUrl(path) {
    // Remover barra inicial se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Se BASE_PATH termina com '/', não duplicar
    if (this.BASE_PATH.endsWith('/')) {
      return this.BASE_PATH + cleanPath;
    }
    
    return this.BASE_PATH + '/' + cleanPath;
  },
  
  // Construir URL para páginas internas (pasta /pagina/)
  buildPageUrl(page) {
    return this.buildUrl(`pagina/${page}`);
  },
  
  // Log do caminho detectado (para debug)
  logBasePath() {
    console.log(`🔗 Caminho base detectado: ${this.BASE_PATH}`);
    console.log(`📍 Localização atual: ${window.location.pathname}`);
  }
};

// Livros da Bíblia para versículos (excluindo Salmos e Provérbios)
CONFIG.LIVROS_VERSICULO = 'GEN,EXO,LEV,NUM,DEU,JOS,JDG,RUT,1SA,2SA,1KI,2KI,1CH,2CH,EZR,NEH,EST,JOB,ISA,JER,LAM,EZK,DAN,HOS,JOL,AMO,OBA,JON,MIC,NAH,HAB,ZEP,HAG,ZEC,MAL,MAT,MRK,LUK,JHN,ACT,ROM,1CO,2CO,GAL,EPH,PHP,COL,1TH,2TH,1TI,2TI,TIT,PHM,HEB,JAS,1PE,2PE,1JN,2JN,3JN,JUD,REV';

// Exportar para uso global (compatível com módulos e scripts normais)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}