// ============================================
// DATA-MANAGER.JS - Gerenciador de Dados JSON
// ============================================

class DataManager {
  constructor() {
    this.cache = {
      devocionais: null,
      videos: null,
      programacao: null,
      dadosIgreja: null,
      dadosBancarios: null,
      redesSociais: null,
      usuarios: null,
      visitantes: null
    };
    
    // Usar CONFIG.BASE_PATH se disponível, senão detectar manualmente
    if (typeof window.CONFIG !== 'undefined' && window.CONFIG.BASE_PATH) {
      this.basePath = window.CONFIG.BASE_PATH;
    } else {
      // Fallback: detectar caminho base manualmente
      const pathname = window.location.pathname;
      if (pathname.includes('/portal/')) {
        this.basePath = '/portal/';
      } else if (pathname.includes('/pagina/')) {
        this.basePath = '../';
      } else {
        this.basePath = '';
      }
    }
  }
  
  /**
   * Resolve o caminho correto baseado na localização atual
   */
  resolvePath(path) {
    return this.basePath + path;
  }

  /**
   * Carrega um arquivo JSON
   * @param {string} arquivo - Nome do arquivo (sem extensão)
   * @returns {Promise<Object>}
   */
  async carregar(arquivo) {
    // NÃO USA CACHE - sempre busca a versão mais recente
    try {
      // Adiciona timestamp para evitar cache do navegador
      const timestamp = new Date().getTime();
      const caminho = this.resolvePath(`data/${arquivo}.json?v=${timestamp}`);
      console.log(`🔍 Carregando ${arquivo} de:`, caminho);
      
      const response = await fetch(caminho);
      if (!response.ok) {
        throw new Error(`Erro ao carregar ${arquivo}: ${response.status}`);
      }
      
      const dados = await response.json();
      console.log(`✅ ${arquivo}.json carregado com sucesso`);
      return dados;
    } catch (erro) {
      console.error(`❌ Erro ao carregar ${arquivo}:`, erro);
      return null;
    }
  }

  /**
   * Carrega dados dos devocionais
   */
  async carregarDevocionais() {
    return await this.carregar('devocionais');
  }

  /**
   * Carrega dados dos vídeos
   */
  async carregarVideos() {
    return await this.carregar('videos');
  }

  /**
   * Carrega dados da programação
   */
  async carregarProgramacao() {
    return await this.carregar('programacao');
  }

  /**
   * Carrega dados da igreja
   */
  async carregarDadosIgreja() {
    return await this.carregar('dados-igreja');
  }

  /**
   * Carrega dados bancários
   */
  async carregarDadosBancarios() {
    return await this.carregar('dados-bancarios');
  }

  /**
   * Carrega redes sociais
   */
  async carregarRedesSociais() {
    return await this.carregar('redes-sociais');
  }

  /**
   * Carrega dados dos usuários
   */
  async carregarUsuarios() {
    return await this.carregar('usuarios');
  }

  /**
   * Carrega dados dos visitantes
   */
  async carregarVisitantes() {
    return await this.carregar('visitantes');
  }

  /**
   * Carrega todos os dados de uma vez
   */
  async carregarTodos() {
    return await Promise.all([
      this.carregarDevocionais(),
      this.carregarVideos(),
      this.carregarProgramacao(),
      this.carregarDadosIgreja(),
      this.carregarDadosBancarios(),
      this.carregarRedesSociais(),
      this.carregarUsuarios(),
      this.carregarVisitantes()
    ]);
  }

  /**
   * Limpa o cache
   */
  limparCache() {
    Object.keys(this.cache).forEach(key => {
      this.cache[key] = null;
    });
    console.log('🗑️ Cache do DataManager limpo!');
  }

  /**
   * Recarrega um arquivo específico (ignora cache)
   */
  async recarregar(arquivo) {
    this.cache[arquivo] = null;
    const timestamp = new Date().getTime();
    try {
      const caminho = this.resolvePath(`data/${arquivo}.json?v=${timestamp}`);
      const response = await fetch(caminho);
      if (!response.ok) {
        throw new Error(`Erro ao recarregar ${arquivo}: ${response.status}`);
      }
      const dados = await response.json();
      this.cache[arquivo] = dados;
      console.log(`🔄 ${arquivo} recarregado com sucesso!`);
      return dados;
    } catch (erro) {
      console.error(`Erro ao recarregar ${arquivo}:`, erro);
      return null;
    }
  }
}

// Instância global
const dataManager = new DataManager();

// Exportar para uso global
window.dataManager = dataManager;
