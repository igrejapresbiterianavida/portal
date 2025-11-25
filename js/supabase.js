// ============================================
// SUPABASE.JS - Cliente usando Edge Functions
// ============================================
// Todas as operações passam pelas Edge Functions
// Nenhuma credencial exposta no código!

class SupabaseClient {
  constructor() {
    // URL e Anon Key do Supabase (ambas públicas e seguras)
    // Prioridade: window.SUPABASE_CONFIG > CONFIG > env
    const config = window.SUPABASE_CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : null);
    
    this.url = (config && config.SUPABASE_URL) || window.SUPABASE_CONFIG?.SUPABASE_URL || '';
    this.anonKey = (config && config.SUPABASE_ANON_KEY) || window.SUPABASE_CONFIG?.SUPABASE_ANON_KEY || '';
    
    // Cliente Supabase para autenticação (é seguro usar a anon key aqui)
    // CRUD continua usando Edge Functions, mas auth precisa do cliente direto
    this.client = null;
    
    // Aguardar a biblioteca Supabase estar disponível (pode demorar um pouco)
    if (this.url && this.anonKey) {
      this.initAuthClient();
    } else {
      console.warn('⚠️ Supabase não configurado. Verifique se config-prod.js foi carregado antes de supabase.js');
    }
    
    console.log('✅ Supabase Client inicializado (Edge Functions + Auth)');
    console.log(`📍 URL: ${this.url || '❌ Não configurado'}`);
    console.log(`🔑 Anon Key: ${this.anonKey ? '✅ Configurado' : '❌ Não configurado'}`);
  }

  /**
   * Inicializar cliente para autenticação
   * A biblioteca Supabase do CDN pode expor de diferentes formas
   */
  initAuthClient() {
    const tryInit = () => {
      let supabaseLib = null;
      
      // Tentar diferentes formas de acesso à biblioteca Supabase
      if (typeof window.supabase !== 'undefined') {
        // Forma 1: window.supabase.createClient (mais comum)
        if (typeof window.supabase.createClient === 'function') {
          supabaseLib = window.supabase;
        }
        // Forma 2: window.supabase.default.createClient (alguns CDNs)
        else if (window.supabase.default && typeof window.supabase.default.createClient === 'function') {
          supabaseLib = window.supabase.default;
        }
      }
      
      if (supabaseLib && supabaseLib.createClient) {
        try {
          this.client = supabaseLib.createClient(this.url, this.anonKey);
          console.log('✅ Cliente Supabase para autenticação inicializado');
          // Atualizar referência global
          window.supabase = this.client;
          return true;
        } catch (erro) {
          console.error('❌ Erro ao criar cliente Supabase:', erro);
          return false;
        }
      }
      return false;
    };
    
    // Tentar imediatamente
    if (!tryInit()) {
      // Se não funcionou, tentar após um delay (a biblioteca pode ainda estar carregando)
      setTimeout(() => {
        if (!this.client) {
          tryInit();
        }
      }, 100);
      
      // Se ainda não funcionou, tentar após mais tempo
      setTimeout(() => {
        if (!this.client) {
          console.warn('⚠️ Cliente Supabase para autenticação não pôde ser inicializado. Verifique se a biblioteca está carregada.');
        }
      }, 1000);
    }
  }

  /**
   * Chamar uma Edge Function
   */
  async chamarEdgeFunction(nomeFunction, dados = {}) {
    if (!this.url) {
      console.error('❌ URL do Supabase não configurada');
      throw new Error('URL do Supabase não configurada');
    }

    const functionUrl = `${this.url}/functions/v1/${nomeFunction}`;
    
    try {
      console.log(`🔍 Chamando Edge Function: ${nomeFunction}`, { url: functionUrl, dados });
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Adicionar headers de autenticação (necessários para Edge Functions)
      if (this.anonKey) {
        headers['Authorization'] = `Bearer ${this.anonKey}`;
        headers['apikey'] = this.anonKey;
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status} na Edge Function ${nomeFunction}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error(`❌ Edge Function ${nomeFunction} retornou erro:`, result.error);
        throw new Error(result.error || 'Erro na Edge Function');
      }
      
      console.log(`✅ Edge Function ${nomeFunction} executada com sucesso`);
      return result.data;
    } catch (erro) {
      console.error(`❌ Erro ao chamar Edge Function ${nomeFunction}:`, erro);
      console.error(`   URL tentada: ${functionUrl}`);
      console.error(`   Dados enviados:`, dados);
      throw erro;
    }
  }

  // ==================== CRUD GENÉRICO ====================
  
  /**
   * Listar registros de uma tabela
   */
  async listar(tabela, filtros = {}) {
    try {
      return await this.chamarEdgeFunction('listar', { tabela, filtros });
    } catch (erro) {
      console.error(`❌ Erro ao listar ${tabela} via Edge Function:`, erro);
      console.warn(`⚠️ Tentando fallback para JSON...`);
      
      // Fallback para JSON se Edge Function falhar
      try {
        const jsonData = await window.dataManager?.carregar(tabela.replace('_', '-'));
        if (jsonData && Array.isArray(jsonData[tabela])) {
          return jsonData[tabela];
        }
        if (jsonData && Array.isArray(jsonData)) {
          return jsonData;
        }
      } catch (jsonErro) {
        console.error(`❌ Erro no fallback JSON para ${tabela}:`, jsonErro);
      }
      
      return [];
    }
  }

  /**
   * Buscar um registro por ID
   */
  async buscarPorId(tabela, id) {
    try {
      return await this.chamarEdgeFunction('buscar-por-id', { tabela, id });
    } catch (erro) {
      console.error(`❌ Erro ao buscar ${tabela}:`, erro);
      return null;
    }
  }

  /**
   * Criar novo registro
   */
  async criar(tabela, dados) {
    try {
      const resultado = await this.chamarEdgeFunction('criar', { tabela, dados });
      console.log(`✅ Registro criado em ${tabela}`);
      return resultado;
    } catch (erro) {
      console.error(`❌ Erro ao criar em ${tabela}:`, erro);
      throw erro;
    }
  }

  /**
   * Atualizar registro
   */
  async atualizar(tabela, id, dados) {
    try {
      const resultado = await this.chamarEdgeFunction('atualizar', { tabela, id, dados });
      console.log(`✅ Registro atualizado em ${tabela}`);
      return resultado;
    } catch (erro) {
      console.error(`❌ Erro ao atualizar em ${tabela}:`, erro);
      throw erro;
    }
  }

  /**
   * Deletar registro
   */
  async deletar(tabela, id) {
    try {
      await this.chamarEdgeFunction('deletar', { tabela, id });
      console.log(`✅ Registro deletado de ${tabela}`);
      return true;
    } catch (erro) {
      console.error(`❌ Erro ao deletar de ${tabela}:`, erro);
      return false;
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================
  
  /**
   * Buscar devocional ativo
   */
  async getDevocionalAtivo() {
    try {
      return await this.chamarEdgeFunction('get-devocional-ativo', {});
    } catch (erro) {
      console.error('❌ Erro ao buscar devocional ativo via Edge Function:', erro);
      console.warn('⚠️ Tentando fallback para JSON...');
      
      // Fallback para JSON
      try {
        const devocionais = await window.dataManager?.carregarDevocionais();
        if (devocionais && devocionais.versiculos) {
          // Retornar formato similar ao Supabase
          return {
            id: 'json-1',
            titulo: 'Devocional Diário',
            texto: devocionais.versiculos[0]?.texto || '',
            data_publicacao: new Date().toISOString().split('T')[0],
            ativo: true
          };
        }
      } catch (jsonErro) {
        console.error('❌ Erro no fallback JSON:', jsonErro);
      }
      
      return null;
    }
  }

  /**
   * Buscar dados da igreja
   */
  async getDadosIgreja() {
    try {
      return await this.chamarEdgeFunction('get-dados-igreja', {});
    } catch (erro) {
      console.error('❌ Erro ao buscar dados da igreja via Edge Function:', erro);
      console.warn('⚠️ Tentando fallback para JSON...');
      
      // Fallback para JSON
      try {
        const dados = await window.dataManager?.carregarDadosIgreja();
        if (dados) {
          // Converter formato JSON para formato Supabase
          return {
            id: 'json-1',
            logradouro: dados.endereco?.logradouro || '',
            numero: dados.endereco?.numero || '',
            complemento: dados.endereco?.complemento || '',
            bairro: dados.endereco?.bairro || '',
            cidade: dados.endereco?.cidade || '',
            estado: dados.endereco?.estado || '',
            cep: dados.endereco?.cep || '',
            telefone: dados.contato?.telefone || '',
            whatsapp: dados.contato?.whatsapp || '',
            email: dados.contato?.email || '',
            email_secretaria: dados.contato?.emailSecretaria || '',
            latitude: dados.localizacao?.latitude || null,
            longitude: dados.localizacao?.longitude || null,
            google_maps_embed: dados.localizacao?.googleMapsEmbed || '',
            google_maps_url: dados.localizacao?.googleMapsUrl || '',
            waze_url: dados.localizacao?.wazeUrl || '',
            uber_url: dados.localizacao?.uberUrl || ''
          };
        }
      } catch (jsonErro) {
        console.error('❌ Erro no fallback JSON:', jsonErro);
      }
      
      return null;
    }
  }

  /**
   * Buscar vídeos recentes
   */
  async getVideosRecentes(limite = 6) {
    return await this.listar('videos', {
      ordem: { campo: 'data_publicacao', ascendente: false },
      limite
    });
  }

  /**
   * Buscar programação do mês
   */
  async getProgramacaoMes(mes, ano) {
    return await this.listar('programacao', {
      igual: { mes, ano }
    });
  }

  /**
   * Buscar visitantes recentes
   */
  async getVisitantesRecentes(limite = 10) {
    return await this.listar('visitantes', {
      ordem: { campo: 'data_cadastro', ascendente: false },
      limite
    });
  }

  /**
   * Buscar usuário por auth_user_id
   */
  async buscarUsuarioPorAuthId(authUserId) {
    const usuarios = await this.listar('usuarios', {
      igual: { auth_user_id: authUserId },
      limite: 1
    });
    return usuarios[0] || null;
  }

  // ==================== AUTENTICAÇÃO (usa cliente direto - seguro) ====================
  
  /**
   * Login com Google usando o cliente Supabase direto
   * É seguro porque a anon key é pública e protegida por RLS
   */
  async loginComGoogle() {
    // Garantir que as configurações estão atualizadas
    if (typeof atualizarConfigSupabase === 'function') {
      atualizarConfigSupabase();
    }
    
    // Garantir que temos URL e anonKey
    if (!this.url || !this.anonKey) {
      // Tentar buscar novamente
      if (window.SUPABASE_CONFIG) {
        this.url = window.SUPABASE_CONFIG.SUPABASE_URL || this.url;
        this.anonKey = window.SUPABASE_CONFIG.SUPABASE_ANON_KEY || this.anonKey;
      }
      
      if (!this.url || !this.anonKey) {
        throw new Error('Configurações do Supabase não disponíveis. Verifique se config-prod.js foi carregado corretamente.');
      }
    }
    
    // Se o cliente não foi inicializado, tentar inicializar agora
    if (!this.client) {
      this.initAuthClient();
      
      // Aguardar um pouco e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!this.client) {
        throw new Error('Cliente Supabase não inicializado. Verifique se a biblioteca Supabase está carregada.');
      }
    }
    
    try {
      // FORÇAR URL de produção - NUNCA usar localhost se estiver em produção
      const hostname = window.location.hostname.toLowerCase();
      const isProduction = hostname.includes('github.io') || 
                          hostname.includes('igrejapresbiterianavida') ||
                          hostname === 'igrejapresbiterianavida.github.io';
      
      let redirectUrl;
      if (isProduction) {
        // SEMPRE usar URL de produção quando em produção
        redirectUrl = 'https://igrejapresbiterianavida.github.io/portal/pagina/auth-callback.html';
        console.log('🌐 PRODUÇÃO DETECTADA - Forçando URL de produção:', redirectUrl);
        console.log('⚠️ IMPORTANTE: Certifique-se de configurar esta URL no painel do Supabase!');
      } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        // Desenvolvimento local
        redirectUrl = `${window.location.origin}/portal/pagina/auth-callback.html`;
        console.log('💻 DESENVOLVIMENTO LOCAL - Usando URL local:', redirectUrl);
      } else {
        // Para qualquer outro ambiente, usar produção
        redirectUrl = 'https://igrejapresbiterianavida.github.io/portal/pagina/auth-callback.html';
        console.log('⚠️ Ambiente desconhecido - Usando URL de produção:', redirectUrl);
      }
      
      console.log(`🔗 URL de redirect configurada: ${redirectUrl}`);
      console.log(`📍 Hostname atual: ${hostname}`);
      console.log(`📍 Origin atual: ${window.location.origin}`);
      
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            // Forçar redirectTo na query string também
            redirect_to: redirectUrl
          }
        }
      });
      
      if (error) throw error;
      return { sucesso: true, data };
    } catch (erro) {
      console.error('❌ Erro no login Google:', erro);
      throw erro;
    }
  }

  async verificarSessao() {
    if (!this.client) {
      return null;
    }
    
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (erro) {
      console.error('❌ Erro ao verificar sessão:', erro);
      return null;
    }
  }

  async logout() {
    if (!this.client) {
      return;
    }
    
    try {
      await this.client.auth.signOut();
    } catch (erro) {
      console.error('❌ Erro ao fazer logout:', erro);
    }
  }

  async getUsuarioAtual() {
    if (!this.client) {
      return null;
    }
    
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (erro) {
      console.error('❌ Erro ao buscar usuário atual:', erro);
      return null;
    }
  }
  
  async getUserFromSession(session) {
    if (!session || !this.client) {
      return null;
    }
    
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (erro) {
      console.error('❌ Erro ao buscar usuário da sessão:', erro);
      return null;
    }
  }

  /**
   * Upload de imagem - precisa ser implementado via Edge Function
   */
  async uploadImagem(arquivo, bucket = 'imagens', caminho = '') {
    console.warn('⚠️ Upload de imagem precisa ser implementado via Edge Function');
    throw new Error('Upload precisa ser implementado via Edge Function');
  }

  async deletarImagem(bucket, caminho) {
    console.warn('⚠️ Deletar imagem precisa ser implementado via Edge Function');
    return false;
  }
}

// Instância global - criar imediatamente
const supabaseClient = new SupabaseClient();
window.supabaseClient = supabaseClient;

// Função para atualizar configurações quando disponíveis
function atualizarConfigSupabase() {
  if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.SUPABASE_URL) {
    if (supabaseClient.url !== window.SUPABASE_CONFIG.SUPABASE_URL || 
        supabaseClient.anonKey !== window.SUPABASE_CONFIG.SUPABASE_ANON_KEY) {
      console.log('🔄 Atualizando configurações do Supabase Client...');
      supabaseClient.url = window.SUPABASE_CONFIG.SUPABASE_URL;
      supabaseClient.anonKey = window.SUPABASE_CONFIG.SUPABASE_ANON_KEY;
      
      // Tentar inicializar cliente de auth se ainda não foi
      if (supabaseClient.url && supabaseClient.anonKey && !supabaseClient.client) {
        supabaseClient.initAuthClient();
      }
    }
  }
}

// Tentar atualizar após delays para garantir que config-prod.js carregou
[100, 300, 500, 1000].forEach(delay => {
  setTimeout(atualizarConfigSupabase, delay);
});

// Também verificar no DOMContentLoaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', atualizarConfigSupabase);
  } else {
    setTimeout(atualizarConfigSupabase, 100);
  }
}
