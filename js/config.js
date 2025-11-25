// ============================================
// CONFIG.JS - Configurações da Aplicação
// ============================================

// Detectar caminho base do projeto automaticamente
// SIMPLES: Se tem /portal/ no pathname, usar /portal/, senão usar /
function detectBasePath() {
  const pathname = window.location.pathname;
  
  // Se tem /portal/ na URL, usar /portal/ como base
  if (pathname.includes('/portal/')) {
    return '/portal/';
  }
  
  // Se não tem /portal/, usar raiz
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
    const required = ['EMAILJS_PUBLIC_KEY'];
    return required.every(key => this.getEnvVar(key) !== '');
  },
  
  // Construir URL correta baseada no caminho base
  // SIMPLES: BASE_PATH + path
  buildUrl(path) {
    // Remover barra inicial do path se existir
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // BASE_PATH sempre termina com /, então só concatenar
    return this.BASE_PATH + cleanPath;
  },
  
  // Construir URL para páginas internas (pasta /pagina/)
  buildPageUrl(page) {
    return this.BASE_PATH + 'pagina/' + page;
  },
  
  // Log do caminho detectado (para debug)
  logBasePath() {
    console.log(`🔗 Caminho base detectado: ${this.BASE_PATH}`);
    console.log(`📍 Localização atual: ${window.location.pathname}`);
  },
  
  // Atualizar links HTML dinamicamente para usar caminhos corretos
  atualizarLinks() {
    if (typeof document === 'undefined') return;
    
    // Mapeamento de links comuns que precisam ser atualizados
    const linkMap = {
      'index.html': this.buildUrl('index.html'),
      '../index.html': this.buildUrl('index.html'),
      './index.html': this.buildUrl('index.html'),
      'pagina/login.html': this.buildPageUrl('login.html'),
      'pagina/admin.html': this.buildPageUrl('admin.html'),
      'pagina/perfil.html': this.buildPageUrl('perfil.html'),
      'pagina/confissao-fe.html': this.buildPageUrl('confissao-fe.html'),
      '../pagina/login.html': this.buildPageUrl('login.html'),
      '../pagina/admin.html': this.buildPageUrl('admin.html'),
      '../pagina/perfil.html': this.buildPageUrl('perfil.html'),
      '../pagina/confissao-fe.html': this.buildPageUrl('confissao-fe.html'),
      './pagina/login.html': this.buildPageUrl('login.html'),
      './pagina/admin.html': this.buildPageUrl('admin.html'),
      './pagina/perfil.html': this.buildPageUrl('perfil.html'),
      './pagina/confissao-fe.html': this.buildPageUrl('confissao-fe.html')
    };
    
    // Atualizar todos os links <a> que correspondem ao mapeamento
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      
      // Ignorar links externos, âncoras e javascript:
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }
      
      // Verificar se está no mapeamento
      if (linkMap[href]) {
        link.setAttribute('href', linkMap[href]);
        return;
      }
      
      // Se o link começa com "pagina/", atualizar
      if (href.startsWith('pagina/')) {
        const page = href.replace('pagina/', '');
        link.setAttribute('href', this.buildPageUrl(page));
        return;
      }
      
      // Se o link começa com "../pagina/", atualizar
      if (href.startsWith('../pagina/')) {
        const page = href.replace('../pagina/', '');
        link.setAttribute('href', this.buildPageUrl(page));
        return;
      }
      
      // Se o link é apenas "index.html" ou "../index.html", atualizar
      if (href === 'index.html' || href === '../index.html' || href === './index.html') {
        link.setAttribute('href', this.buildUrl('index.html'));
        return;
      }
    });
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