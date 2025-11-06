// ============================================
// AUTH.JS - Sistema de Autenticação
// ============================================

class AuthSystem {
  constructor() {
    this.usuario = null;
    this.token = null;
    this.sessaoExpiresAt = null;
    this.tentativasLogin = {};
    
    this.init();
  }

  init() {
    // Verificar se há sessão ativa
    this.verificarSessaoAtiva();
    
    // Configurar interceptadores para requisições protegidas
    this.configurarInterceptadores();
  }

  // ==================== AUTENTICAÇÃO ====================
  
  async login(email, senha) {
    try {
      // Verificar tentativas de login
      if (this.verificarBloqueio(email)) {
        throw new Error('Muitas tentativas de login. Tente novamente em 5 minutos.');
      }

      // Buscar dados dos usuários
      const response = await fetch('data/usuarios.json');
      const data = await response.json();
      
      // Procurar usuário
      const usuario = data.usuarios.find(u => 
        u.email === email && u.senha === senha && u.status === 'ativo'
      );

      if (!usuario) {
        this.registrarTentativaLogin(email);
        throw new Error('Email ou senha incorretos');
      }

      // Limpar tentativas de login
      delete this.tentativasLogin[email];

      // Gerar token (simulado)
      const token = this.gerarToken(usuario);
      
      // Salvar sessão
      this.salvarSessao(usuario, token);
      
      // Atualizar último login (em produção, isso seria no Supabase)
      await this.atualizarUltimoLogin(usuario.id);

      console.log('✅ Login realizado com sucesso:', usuario.nome);
      return { sucesso: true, usuario, token };

    } catch (erro) {
      console.error('❌ Erro no login:', erro.message);
      return { sucesso: false, erro: erro.message };
    }
  }

  logout() {
    // Limpar dados locais
    this.usuario = null;
    this.token = null;
    this.sessaoExpiresAt = null;
    
    // Limpar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
    localStorage.removeItem('auth_expires');
    localStorage.removeItem('ipv_sessao');
    
    console.log('🚪 Logout realizado');
    
    // Redirecionar para login
    if (window.location.pathname !== '/login.html') {
      window.location.href = '/login.html';
    }
  }

  // ==================== VERIFICAÇÕES ====================
  
  verificarSessaoAtiva() {
    const token = localStorage.getItem('auth_token');
    const usuarioString = localStorage.getItem('auth_usuario');
    const expires = localStorage.getItem('auth_expires');

    if (token && usuarioString && expires) {
      const expiresAt = new Date(expires);
      
      if (expiresAt > new Date()) {
        this.token = token;
        this.usuario = JSON.parse(usuarioString);
        this.sessaoExpiresAt = expiresAt;
        console.log('🔐 Sessão ativa:', this.usuario.nome);
        return true;
      } else {
        console.log('⏰ Sessão expirada');
        this.logout();
      }
    }
    
    return false;
  }

  verificarBloqueio(email) {
    const tentativas = this.tentativasLogin[email];
    if (!tentativas) return false;
    
    const agora = Date.now();
    const ultimaTentativa = tentativas.ultimaTentativa;
    const bloqueadoAte = ultimaTentativa + (5 * 60 * 1000); // 5 minutos
    
    return tentativas.count >= 3 && agora < bloqueadoAte;
  }

  registrarTentativaLogin(email) {
    if (!this.tentativasLogin[email]) {
      this.tentativasLogin[email] = { count: 0, ultimaTentativa: 0 };
    }
    
    this.tentativasLogin[email].count++;
    this.tentativasLogin[email].ultimaTentativa = Date.now();
  }

  // ==================== AUTORIZAÇÃO ====================
  
  temPermissao(permissao) {
    if (!this.usuario) return false;
    return this.usuario.permissoes.includes(permissao);
  }

  ehAdmin() {
    return this.usuario && this.usuario.tipo === 'administracao';
  }

  ehMembro() {
    return this.usuario && this.usuario.tipo === 'membro';
  }

  ehLideranca() {
    return this.usuario && this.usuario.tipo === 'lideranca';
  }

  // ==================== UTILITÁRIOS ====================
  
  gerarToken(usuario) {
    // Em produção, isso seria um JWT real do Supabase
    const payload = {
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      iat: Date.now()
    };
    
    return btoa(JSON.stringify(payload));
  }

  salvarSessao(usuario, token) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000)); // 24 horas
    
    this.usuario = usuario;
    this.token = token;
    this.sessaoExpiresAt = expires;
    
    // Salvar no formato original para compatibilidade
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_usuario', JSON.stringify(usuario));
    localStorage.setItem('auth_expires', expires.toISOString());
    
    // Salvar também no formato para a navbar
    const sessaoNavbar = {
      usuario: usuario,
      token: token,
      expiresAt: expires.getTime()
    };
    localStorage.setItem('ipv_sessao', JSON.stringify(sessaoNavbar));
  }

  async atualizarUltimoLogin(usuarioId) {
    // Em produção, isso seria uma chamada para o Supabase
    console.log(`📅 Último login atualizado para usuário ${usuarioId}`);
  }

  configurarInterceptadores() {
    // Interceptar requisições para APIs protegidas
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [resource, config = {}] = args;
      
      // Adicionar token em requisições para admin/
      if (typeof resource === 'string' && resource.includes('/admin/')) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.token}`
        };
      }
      
      return originalFetch(resource, config);
    };
  }

  // ==================== PROTEÇÃO DE ROTAS ====================
  
  protegerRota() {
    const paginasPublicas = ['/', '/index.html', '/login.html'];
    const paginaAtual = window.location.pathname;
    
    if (!paginasPublicas.includes(paginaAtual) && !this.usuario) {
      console.log('🚫 Acesso negado - redirecionando para login');
      window.location.href = '/login.html';
      return false;
    }
    
    return true;
  }

  protegerAdmin() {
    if (!this.ehAdmin()) {
      console.log('🚫 Acesso negado - não é administrador');
      window.location.href = '/index.html';
      return false;
    }
    
    return true;
  }

  // ==================== INTEGRAÇÃO SUPABASE (FUTURO) ====================
  
  // Métodos preparados para migração ao Supabase
  async loginComSupabase(email, senha) {
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: email,
    //   password: senha
    // });
    
    console.log('🔮 Método preparado para Supabase Auth');
  }

  async loginComGoogle() {
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'google'
    // });
    
    console.log('🔮 Método preparado para Google OAuth via Supabase');
  }
}

// Instância global
const auth = new AuthSystem();

// Exportar para uso global
window.auth = auth;

// Componente Alpine.js para formulário de login
function loginForm() {
  return {
    dados: {
      email: '',
      senha: ''
    },
    carregando: false,
    erro: '',
    
    async enviar() {
      if (!this.dados.email || !this.dados.senha) {
        this.erro = 'Preencha email e senha';
        return;
      }
      
      this.carregando = true;
      this.erro = '';
      
      try {
        const resultado = await auth.login(this.dados.email, this.dados.senha);
        
        if (resultado.sucesso) {
          // Redirecionar baseado no tipo de usuário
          if (auth.ehAdmin()) {
            window.location.href = '/admin.html';
          } else {
            // Redirecionar para a home logado ao invés do dashboard
            window.location.href = '/index.html';
          }
        } else {
          this.erro = resultado.erro;
        }
      } catch (erro) {
        this.erro = 'Erro inesperado. Tente novamente.';
        console.error('Erro no login:', erro);
      } finally {
        this.carregando = false;
      }
    },
    
    preencherDemo(tipo) {
      if (tipo === 'admin') {
        this.dados.email = 'admin@ipbvida.com.br';
        this.dados.senha = 'admin123';
      } else if (tipo === 'membro') {
        this.dados.email = 'membro@ipbvida.com.br';
        this.dados.senha = 'membro123';
      }
    }
  };
}