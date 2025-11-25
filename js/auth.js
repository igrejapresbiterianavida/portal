// ============================================
// AUTH.JS - Sistema de Autenticação
// ============================================

class AuthSystem {
  constructor() {
    this.usuario = null;
    this.token = null;
    this.sessaoExpiresAt = null;
    this.tentativasLogin = {};
    
    // Detectar caminho base
    this.basePath = window.location.pathname.includes('/pagina/') ? '../' : '';
    
    this.init();
  }
  
  // Helper para resolver caminhos corretamente
  resolvePath(path) {
    return this.basePath + path;
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
      const caminhoUsuarios = this.resolvePath('data/usuarios.json');
      console.log('🔍 Buscando usuários em:', caminhoUsuarios);
      
      const response = await fetch(caminhoUsuarios);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Dados de usuários carregados:', data.usuarios?.length || 0, 'usuários');
      
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

  async logout() {
    console.log('🚪 Realizando logout...');
    
    // Logout do Supabase se estiver configurado
    if (window.supabaseClient) {
      await window.supabaseClient.logout();
    }
    
    // Usar função de limpeza
    this.limparSessao();
    
    // Redirecionar para index.html usando CONFIG para caminho correto
    const indexUrl = window.CONFIG ? window.CONFIG.buildUrl('index.html') : 'index.html';
    window.location.href = indexUrl;
  }

  // ==================== VERIFICAÇÕES ====================
  
  verificarSessaoAtiva() {
    // PRIORIDADE 1: Verificar localStorage primeiro (mais rápido, retorna imediatamente)
    const token = localStorage.getItem('auth_token');
    const usuarioString = localStorage.getItem('auth_usuario');
    const expires = localStorage.getItem('auth_expires');

    console.log('🔍 Verificando sessão ativa...', {
      temToken: !!token,
      temUsuario: !!usuarioString,
      temExpires: !!expires
    });

    if (token && usuarioString && expires) {
      const expiresAt = new Date(expires);
      const agora = new Date();
      
      console.log('🔍 Verificando expiração:', {
        expiraEm: expiresAt.toLocaleString(),
        agora: agora.toLocaleString(),
        valido: expiresAt > agora
      });
      
      if (expiresAt > agora) {
        this.token = token;
        this.usuario = JSON.parse(usuarioString);
        this.sessaoExpiresAt = expiresAt;
        console.log('🔐 Sessão ativa (localStorage):', this.usuario.nome, '| Tipo:', this.usuario.tipo);
        
        // Verificar Supabase em background para sincronizar
        if (window.supabaseClient && window.supabaseClient.client) {
          window.supabaseClient.client.auth.getSession().then(({ data: { session }, error }) => {
            if (session && !error) {
              // Sessão Supabase ativa - atualizar se necessário
              this.verificarSessaoSupabase().then(ativo => {
                if (ativo && window.authNavbar) {
                  // Atualizar navbar se existir
                  const navbar = document.querySelector('[x-data*="authNavbar"]');
                  if (navbar && navbar._x_dataStack) {
                    const navbarData = navbar._x_dataStack[0];
                    if (navbarData) {
                      navbarData.estaLogado = true;
                      navbarData.usuario = this.usuario;
                      navbarData.atualizarSaudacao();
                    }
                  }
                }
              });
            }
          }).catch(erro => {
            console.log('Supabase session check:', erro);
          });
        }
        
        return true;
      } else {
        console.log('⏰ Sessão expirada - limpando...');
        this.limparSessao();
      }
    }
    
    // PRIORIDADE 2: Se não tem no localStorage, verificar Supabase diretamente
    if (window.supabaseClient && window.supabaseClient.client) {
      // Verificar sessão do Supabase de forma assíncrona (mas não bloqueia)
      window.supabaseClient.client.auth.getSession().then(({ data: { session }, error }) => {
        if (session && !error) {
          // Sessão Supabase ativa - buscar perfil e atualizar
          this.verificarSessaoSupabase().then(ativo => {
            if (ativo && window.authNavbar) {
              // Atualizar navbar se existir
              const navbar = document.querySelector('[x-data*="authNavbar"]');
              if (navbar && navbar._x_dataStack) {
                const navbarData = navbar._x_dataStack[0];
                if (navbarData) {
                  navbarData.estaLogado = true;
                  navbarData.usuario = this.usuario;
                  navbarData.atualizarSaudacao();
                }
              }
            }
          });
        }
      }).catch(erro => {
        console.log('Supabase session check:', erro);
      });
    }
    
    console.log('❌ Nenhuma sessão ativa encontrada');
    return false;
  }
  
  limparSessao() {
    // Limpar dados locais
    this.usuario = null;
    this.token = null;
    this.sessaoExpiresAt = null;
    
    // Limpar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
    localStorage.removeItem('auth_expires');
    localStorage.removeItem('ipv_sessao');
    
    console.log('🧹 Sessão limpa');
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
    return this.usuario && (this.usuario.tipo === 'membro' || this.usuario.tipo === 'lideranca' || this.usuario.tipo === 'administracao');
  }

  ehVisitante() {
    return this.usuario && this.usuario.tipo === 'visitante';
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
    const paginaPublicas = ['/', '/index.html', '/pagina/login.html'];
    const paginaAtual = window.location.pathname;
    
    if (!paginaPublicas.includes(paginaAtual) && !this.usuario) {
      console.log('🚫 Acesso negado - redirecionando para login');
      const loginUrl = window.CONFIG ? window.CONFIG.buildPageUrl('login.html') : '/pagina/login.html';
      window.location.href = loginUrl;
      return false;
    }
    
    return true;
  }

  protegerAdmin() {
    console.log('🔐 Verificando proteção de admin...');
    
    // Primeiro verificar se está logado
    if (!this.verificarSessaoAtiva()) {
      console.log('🚫 Não está logado - redirecionando para login');
      const loginUrl = window.CONFIG ? window.CONFIG.buildPageUrl('login.html') : 'login.html';
      window.location.href = loginUrl;
      return false;
    }
    
    // Verificar se é admin
    if (!this.ehAdmin()) {
      console.log('🚫 Não é admin - redirecionando para home. Tipo atual:', this.usuario ? this.usuario.tipo : 'nenhum');
      alert('🚫 Acesso negado! Esta área é restrita para administradores.');
      const homeUrl = window.CONFIG ? window.CONFIG.buildUrl('index.html') : '../index.html';
      window.location.href = homeUrl;
      return false;
    }
    
    console.log('✅ Proteção admin: acesso autorizado para', this.usuario.nome);
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
    try {
      if (window.supabaseClient) {
        const resultado = await window.supabaseClient.loginComGoogle();
        return resultado;
      } else {
        throw new Error('Supabase não configurado');
      }
    } catch (erro) {
      console.error('❌ Erro no login Google:', erro);
      return { sucesso: false, erro: erro.message };
    }
  }

  /**
   * Salvar sessão do Supabase
   */
  salvarSessaoSupabase(usuario, session) {
    this.usuario = {
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      sobrenome: usuario.sobrenome || '',
      tipo: usuario.tipo,
      status: usuario.status,
      avatar: usuario.avatar_url || `https://ui-avatars.com/api/?name=${usuario.nome}&background=1A4731&color=fff&size=128`,
      permissoes: usuario.permissoes || []
    };
    
    this.token = session.access_token;
    this.sessaoExpiresAt = new Date(session.expires_at * 1000);
    
    // Salvar no localStorage (SÍNCRONO - garante que seja salvo antes de redirecionar)
    try {
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_usuario', JSON.stringify(this.usuario));
      localStorage.setItem('auth_expires', this.sessaoExpiresAt.toISOString());
      
      // Salvar também no formato para a navbar
      const sessaoNavbar = {
        usuario: this.usuario,
        token: this.token,
        expiresAt: this.sessaoExpiresAt.getTime()
      };
      localStorage.setItem('ipv_sessao', JSON.stringify(sessaoNavbar));
      
      // Disparar evento customizado para notificar que a sessão foi salva
      window.dispatchEvent(new CustomEvent('sessaoSalva', {
        detail: { usuario: this.usuario }
      }));
      
      console.log('✅ Sessão Supabase salva:', this.usuario.nome);
    } catch (erro) {
      console.error('❌ Erro ao salvar sessão no localStorage:', erro);
      throw erro;
    }
  }

  /**
   * Verificar sessão do Supabase
   */
  async verificarSessaoSupabase() {
    try {
      if (!window.supabaseClient || !window.supabaseClient.client) {
        return false;
      }
      
      const { data: { session }, error } = await window.supabaseClient.client.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão Supabase:', error);
        return false;
      }
      
      if (session && session.user) {
        // Buscar perfil do usuário
        const usuario = await window.supabaseClient.buscarUsuarioPorAuthId(session.user.id);
        
        if (usuario) {
          this.salvarSessaoSupabase(usuario, session);
          return true;
        } else {
          // Se não tem perfil, criar um básico
          console.log('⚠️ Perfil não encontrado, criando perfil básico...');
          const novoPerfil = {
            auth_user_id: session.user.id,
            email: session.user.email,
            nome: session.user.user_metadata?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Usuário',
            sobrenome: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            tipo: 'visitante', // Todos começam como visitante
            status: 'ativo',
            avatar_url: session.user.user_metadata?.avatar_url || null
          };
          
          const perfilCriado = await window.supabaseClient.criar('usuarios', novoPerfil);
          if (perfilCriado) {
            this.salvarSessaoSupabase(perfilCriado, session);
            return true;
          }
        }
      }
      return false;
    } catch (erro) {
      console.error('❌ Erro ao verificar sessão Supabase:', erro);
      return false;
    }
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
    
    // Sign Up
    modalSignUpAberto: false,
    dadosSignUp: {
      nome: '',
      sobrenome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: ''
    },
    carregandoSignUp: false,
    erroSignUp: '',
    sucessoSignUp: '',
    
    // Reset Senha
    modalResetAberto: false,
    dadosReset: {
      email: ''
    },
    carregandoReset: false,
    erroReset: '',
    sucessoReset: '',
    
    abrirModalSignUp() {
      this.modalSignUpAberto = true;
      this.erroSignUp = '';
      this.sucessoSignUp = '';
      this.dadosSignUp = {
        nome: '',
        sobrenome: '',
        email: '',
        telefone: '',
        senha: '',
        confirmarSenha: ''
      };
    },
    
    fecharModalSignUp() {
      this.modalSignUpAberto = false;
      this.erroSignUp = '';
      this.sucessoSignUp = '';
    },
    
    abrirModalReset() {
      this.modalResetAberto = true;
      this.erroReset = '';
      this.sucessoReset = '';
      this.dadosReset = { email: '' };
    },
    
    fecharModalReset() {
      this.modalResetAberto = false;
      this.erroReset = '';
      this.sucessoReset = '';
    },
    
    async enviarSignUp() {
      // Validações
      if (!this.dadosSignUp.nome || !this.dadosSignUp.email || !this.dadosSignUp.senha) {
        this.erroSignUp = 'Preencha todos os campos obrigatórios';
        return;
      }
      
      if (this.dadosSignUp.senha !== this.dadosSignUp.confirmarSenha) {
        this.erroSignUp = 'As senhas não coincidem';
        return;
      }
      
      if (this.dadosSignUp.senha.length < 6) {
        this.erroSignUp = 'A senha deve ter pelo menos 6 caracteres';
        return;
      }
      
      this.carregandoSignUp = true;
      this.erroSignUp = '';
      this.sucessoSignUp = '';
      
      try {
        // Chamar Edge Function para criar usuário
        if (!window.supabaseClient || !window.supabaseClient.url) {
          throw new Error('Sistema de autenticação não disponível');
        }
        
        const functionUrl = `${window.supabaseClient.url}/functions/v1/criar-usuario-com-senha`;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.supabaseClient.anonKey || ''}`,
            'apikey': window.supabaseClient.anonKey || ''
          },
          body: JSON.stringify({
            nome: this.dadosSignUp.nome,
            sobrenome: this.dadosSignUp.sobrenome || '',
            email: this.dadosSignUp.email.toLowerCase(),
            senha: this.dadosSignUp.senha,
            telefone: this.dadosSignUp.telefone || '',
            tipo: 'visitante'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar conta');
        }
        
        const result = await response.json();
        
        if (result.success) {
          this.sucessoSignUp = 'Conta criada com sucesso! Verifique seu email para confirmar sua senha.';
          
          // Limpar formulário
          this.dadosSignUp = {
            nome: '',
            sobrenome: '',
            email: '',
            telefone: '',
            senha: '',
            confirmarSenha: ''
          };
          
          // Fechar modal após 3 segundos
          setTimeout(() => {
            this.fecharModalSignUp();
          }, 3000);
        } else {
          throw new Error(result.error || 'Erro ao criar conta');
        }
      } catch (erro) {
        this.erroSignUp = erro.message || 'Erro ao criar conta. Tente novamente.';
        console.error('Erro no signup:', erro);
      } finally {
        this.carregandoSignUp = false;
      }
    },
    
    async enviarReset() {
      if (!this.dadosReset.email) {
        this.erroReset = 'Digite seu email';
        return;
      }
      
      this.carregandoReset = true;
      this.erroReset = '';
      this.sucessoReset = '';
      
      try {
        // Chamar Edge Function para resetar senha
        if (!window.supabaseClient || !window.supabaseClient.url) {
          throw new Error('Sistema de autenticação não disponível');
        }
        
        const functionUrl = `${window.supabaseClient.url}/functions/v1/resetar-senha`;
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.supabaseClient.anonKey || ''}`,
            'apikey': window.supabaseClient.anonKey || ''
          },
          body: JSON.stringify({
            email: this.dadosReset.email.toLowerCase()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao solicitar reset de senha');
        }
        
        const result = await response.json();
        
        if (result.success) {
          this.sucessoReset = result.message || 'Instruções para resetar sua senha foram enviadas para seu email.';
          
          // Limpar formulário
          this.dadosReset = { email: '' };
        } else {
          throw new Error(result.error || 'Erro ao solicitar reset de senha');
        }
      } catch (erro) {
        this.erroReset = erro.message || 'Erro ao solicitar reset de senha. Tente novamente.';
        console.error('Erro no reset:', erro);
      } finally {
        this.carregandoReset = false;
      }
    },
    
    async enviar() {
      if (!this.dados.email || !this.dados.senha) {
        this.erro = 'Preencha email e senha';
        return;
      }
      
      this.carregando = true;
      this.erro = '';
      
      try {
        // Tentar login com Supabase primeiro
        if (window.supabase && window.supabaseClient) {
          const { data, error } = await window.supabase.auth.signInWithPassword({
            email: this.dados.email,
            password: this.dados.senha
          });

          if (error) throw error;

          if (data.session) {
            // Buscar perfil do usuário
            const usuario = await window.supabaseClient.buscarUsuarioPorAuthId(data.user.id);
            
            if (usuario) {
              auth.salvarSessaoSupabase(usuario, data.session);
              
              // Redirecionar baseado no tipo de usuário
              if (auth.ehAdmin()) {
                const adminUrl = window.CONFIG ? window.CONFIG.buildPageUrl('admin.html') : 'admin.html';
                window.location.href = adminUrl;
              } else {
                const homeUrl = window.CONFIG ? window.CONFIG.buildUrl('index.html') : '../index.html';
                window.location.href = homeUrl;
              }
              return;
            }
          }
        }

        // Fallback: sistema antigo (JSON)
        const resultado = await auth.login(this.dados.email, this.dados.senha);
        
        if (resultado.sucesso) {
          // Redirecionar baseado no tipo de usuário usando CONFIG
          if (auth.ehAdmin()) {
            const adminUrl = window.CONFIG ? window.CONFIG.buildPageUrl('admin.html') : 'admin.html';
            window.location.href = adminUrl;
          } else {
            // Redirecionar para a home logado
            const homeUrl = window.CONFIG ? window.CONFIG.buildUrl('index.html') : '../index.html';
            window.location.href = homeUrl;
          }
        } else {
          this.erro = resultado.erro;
        }
      } catch (erro) {
        this.erro = erro.message || 'Erro inesperado. Tente novamente.';
        console.error('Erro no login:', erro);
      } finally {
        this.carregando = false;
      }
    },

    async loginComGoogle() {
      this.carregando = true;
      this.erro = '';
      
      try {
        const resultado = await auth.loginComGoogle();
        
        if (!resultado.sucesso) {
          this.erro = resultado.erro || 'Erro ao fazer login com Google';
        }
        // O redirecionamento será feito automaticamente pelo OAuth
      } catch (erro) {
        this.erro = 'Erro ao fazer login com Google. Tente novamente.';
        console.error('Erro no login Google:', erro);
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