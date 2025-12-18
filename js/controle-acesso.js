// ============================================
// CONTROLE-ACESSO.JS - Sistema de Níveis de Acesso
// ============================================

/**
 * Sistema centralizado de controle de acesso
 * Gerencia a visibilidade de dados baseado no tipo de usuário
 */
class ControleAcesso {
  constructor() {
    // Hierarquia de acesso (do menor para o maior)
    this.hierarquia = ['visitante', 'membro', 'lideranca', 'administracao'];
    
    // Cache do tipo de usuário atual
    this._tipoUsuario = null;
    this._usuario = null;
  }

  /**
   * Obtém o tipo do usuário atual
   * @returns {string} - 'visitante', 'membro', 'lideranca' ou 'administracao'
   */
  obterTipoUsuario() {
    // Verificar cache primeiro (com timeout de 5 segundos)
    if (this._tipoUsuario && this._usuario && this._cacheTime && (Date.now() - this._cacheTime < 5000)) {
      return this._tipoUsuario;
    }

    // Verificar se há usuário logado via auth
    if (window.auth && window.auth.usuario && window.auth.usuario.tipo) {
      this._usuario = window.auth.usuario;
      this._tipoUsuario = window.auth.usuario.tipo;
      this._cacheTime = Date.now();
      console.log('🔐 Tipo de usuário (via auth):', this._tipoUsuario);
      return this._tipoUsuario;
    }

    // Tentar localStorage como fallback
    try {
      const usuarioString = localStorage.getItem('ipvida_usuario');
      if (usuarioString) {
        const usuario = JSON.parse(usuarioString);
        if (usuario && usuario.tipo) {
          this._usuario = usuario;
          this._tipoUsuario = usuario.tipo;
          this._cacheTime = Date.now();
          console.log('🔐 Tipo de usuário (via localStorage):', this._tipoUsuario);
          return this._tipoUsuario;
        }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler usuário do localStorage:', e);
    }

    // Não logado = visitante
    console.log('🔐 Tipo de usuário: visitante (não logado)');
    return 'visitante';
  }

  /**
   * Obtém o usuário atual
   * @returns {Object|null}
   */
  obterUsuario() {
    if (this._usuario) return this._usuario;
    
    if (window.auth && auth.verificarSessaoAtiva && auth.verificarSessaoAtiva()) {
      this._usuario = auth.usuario;
      return this._usuario;
    }
    
    return null;
  }

  /**
   * Verifica se o usuário está logado
   * @returns {boolean}
   */
  estaLogado() {
    return window.auth && auth.verificarSessaoAtiva && auth.verificarSessaoAtiva();
  }

  /**
   * Verifica se o usuário é admin
   * @returns {boolean}
   */
  ehAdmin() {
    return this.obterTipoUsuario() === 'administracao';
  }

  /**
   * Verifica se o usuário é membro ou superior
   * @returns {boolean}
   */
  ehMembro() {
    const tipo = this.obterTipoUsuario();
    return ['membro', 'lideranca', 'administracao'].includes(tipo);
  }

  /**
   * Verifica se o usuário é liderança ou superior
   * @returns {boolean}
   */
  ehLideranca() {
    const tipo = this.obterTipoUsuario();
    return ['lideranca', 'administracao'].includes(tipo);
  }

  /**
   * Limpa o cache (chamar após login/logout)
   */
  limparCache() {
    this._tipoUsuario = null;
    this._usuario = null;
  }

  /**
   * Verifica se o usuário pode acessar um recurso
   * @param {Array|string} niveisPermitidos - Array de níveis permitidos ou string única
   * @returns {boolean}
   */
  podeAcessar(niveisPermitidos) {
    const tipoUsuario = this.obterTipoUsuario();
    
    // Admin pode ver tudo
    if (tipoUsuario === 'administracao') {
      return true;
    }

    // Normalizar para array
    const niveis = Array.isArray(niveisPermitidos) ? niveisPermitidos : [niveisPermitidos];

    // Verificar se visitante pode acessar
    if (niveis.includes('visitante')) {
      return true;
    }

    // Verificar se membro pode acessar
    if (niveis.includes('membro') && ['membro', 'lideranca', 'administracao'].includes(tipoUsuario)) {
      return true;
    }

    // Verificar se liderança pode acessar
    if (niveis.includes('lideranca') && ['lideranca', 'administracao'].includes(tipoUsuario)) {
      return true;
    }

    // Verificar acesso direto ao tipo
    if (niveis.includes(tipoUsuario)) {
      return true;
    }

    return false;
  }

  /**
   * Filtra um array de dados baseado no nível de acesso
   * @param {Array} dados - Array de objetos com campo nivel_acesso
   * @param {string} campoNivelAcesso - Nome do campo que contém o nível de acesso
   * @returns {Array} - Dados filtrados
   */
  filtrarPorAcesso(dados, campoNivelAcesso = 'nivel_acesso') {
    if (!Array.isArray(dados)) return [];
    
    return dados.filter(item => {
      const niveis = item[campoNivelAcesso];
      if (!niveis) return true; // Se não tem nível definido, mostra para todos
      return this.podeAcessar(niveis);
    });
  }

  /**
   * Verifica se deve mostrar empty state para o usuário
   * Um empty state é mostrado quando:
   * - O usuário está logado (membro ou superior)
   * - Não há dados disponíveis para ele
   * @param {Array} dados - Dados após filtro de acesso
   * @returns {boolean}
   */
  mostrarEmptyState(dados) {
    const logado = this.estaLogado();
    const semDados = !dados || dados.length === 0;
    
    // Visitante não vê empty state, simplesmente não vê a seção
    if (!logado) return false;
    
    // Usuário logado sem dados vê empty state
    return semDados;
  }

  /**
   * Verifica se deve ocultar completamente uma seção
   * Uma seção é ocultada quando:
   * - Visitante não tem acesso
   * - Não há dados para o visitante
   * @param {Array} dados - Dados após filtro
   * @returns {boolean}
   */
  ocultarSecao(dados) {
    const logado = this.estaLogado();
    const semDados = !dados || dados.length === 0;
    
    // Se não está logado e não tem dados, oculta a seção
    if (!logado && semDados) return true;
    
    return false;
  }

  /**
   * Retorna as classes CSS baseado no tipo de usuário
   * @returns {Object}
   */
  obterClassesUsuario() {
    const tipo = this.obterTipoUsuario();
    return {
      'usuario-visitante': tipo === 'visitante',
      'usuario-membro': tipo === 'membro',
      'usuario-lideranca': tipo === 'lideranca',
      'usuario-admin': tipo === 'administracao',
      'usuario-logado': this.estaLogado(),
      'usuario-nao-logado': !this.estaLogado()
    };
  }

  /**
   * Retorna opções de nível de acesso para formulários
   * @returns {Array}
   */
  obterOpcoesNivelAcesso() {
    return [
      { valor: 'visitante', label: 'Visitantes (Todos)', icone: 'public', descricao: 'Visível para qualquer pessoa' },
      { valor: 'membro', label: 'Membros', icone: 'people', descricao: 'Apenas membros da igreja' },
      { valor: 'lideranca', label: 'Liderança', icone: 'admin_panel_settings', descricao: 'Apenas líderes e pastores' },
      { valor: 'administracao', label: 'Administração', icone: 'security', descricao: 'Apenas administradores' }
    ];
  }

  /**
   * Formata o nível de acesso para exibição
   * @param {Array|string} niveis
   * @returns {string}
   */
  formatarNivelAcesso(niveis) {
    if (!niveis) return 'Todos';
    
    const niveisArray = Array.isArray(niveis) ? niveis : [niveis];
    
    if (niveisArray.includes('visitante')) return 'Público';
    if (niveisArray.length === 1) {
      const labels = {
        'membro': 'Membros',
        'lideranca': 'Liderança',
        'administracao': 'Administração'
      };
      return labels[niveisArray[0]] || 'Desconhecido';
    }
    
    return niveisArray.map(n => {
      const labels = {
        'visitante': 'Visitantes',
        'membro': 'Membros',
        'lideranca': 'Liderança',
        'administracao': 'Admin'
      };
      return labels[n] || n;
    }).join(', ');
  }

  /**
   * Retorna o ícone para o nível de acesso
   * @param {Array|string} niveis
   * @returns {string}
   */
  obterIconeNivelAcesso(niveis) {
    if (!niveis) return 'public';
    
    const niveisArray = Array.isArray(niveis) ? niveis : [niveis];
    
    if (niveisArray.includes('visitante')) return 'public';
    if (niveisArray.includes('membro') && !niveisArray.includes('lideranca')) return 'people';
    if (niveisArray.includes('lideranca') && !niveisArray.includes('administracao')) return 'admin_panel_settings';
    if (niveisArray.includes('administracao') && niveisArray.length === 1) return 'security';
    
    return 'lock';
  }

  /**
   * Retorna a cor para o badge de nível de acesso
   * @param {Array|string} niveis
   * @returns {string}
   */
  obterCorNivelAcesso(niveis) {
    if (!niveis) return '#4CAF50'; // Verde - público
    
    const niveisArray = Array.isArray(niveis) ? niveis : [niveis];
    
    if (niveisArray.includes('visitante')) return '#4CAF50'; // Verde
    if (niveisArray.includes('membro')) return '#2196F3'; // Azul
    if (niveisArray.includes('lideranca')) return '#FF9800'; // Laranja
    if (niveisArray.includes('administracao') && niveisArray.length === 1) return '#F44336'; // Vermelho
    
    return '#9E9E9E'; // Cinza
  }
}

// Instância global
const controleAcesso = new ControleAcesso();

// Exportar para uso global
window.controleAcesso = controleAcesso;

// Limpar cache quando houver mudança de sessão
document.addEventListener('DOMContentLoaded', () => {
  // Escutar mudanças de autenticação
  window.addEventListener('sessao-atualizada', () => {
    controleAcesso.limparCache();
    console.log('🔄 Cache de controle de acesso limpo');
  });

  // Escutar logout
  window.addEventListener('usuario-deslogou', () => {
    controleAcesso.limparCache();
    console.log('🔄 Cache de controle de acesso limpo (logout)');
  });
});

/**
 * Componente Alpine.js para usar nas views
 */
function acessoUsuario() {
  return {
    get tipoUsuario() {
      return controleAcesso.obterTipoUsuario();
    },
    
    get usuario() {
      return controleAcesso.obterUsuario();
    },
    
    get estaLogado() {
      return controleAcesso.estaLogado();
    },
    
    get ehAdmin() {
      return controleAcesso.ehAdmin();
    },
    
    get ehMembro() {
      return controleAcesso.ehMembro();
    },
    
    get ehLideranca() {
      return controleAcesso.ehLideranca();
    },
    
    podeAcessar(niveis) {
      return controleAcesso.podeAcessar(niveis);
    },
    
    filtrarPorAcesso(dados, campo = 'nivel_acesso') {
      return controleAcesso.filtrarPorAcesso(dados, campo);
    }
  };
}

// Exportar componente Alpine
window.acessoUsuario = acessoUsuario;

console.log('✅ Sistema de Controle de Acesso carregado');

