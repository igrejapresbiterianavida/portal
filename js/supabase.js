// ============================================
// SUPABASE.JS - Cliente Supabase e Helpers
// ============================================

// Importar Supabase JS Client
// IMPORTANTE: Adicione esta linha no HTML antes deste script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

class SupabaseClient {
  constructor() {
    // Configurações do Supabase (vem do config.js ou env)
    this.url = CONFIG?.SUPABASE_URL || '';
    this.anonKey = CONFIG?.SUPABASE_ANON_KEY || '';
    
    // Debug: verificar o que está disponível
    console.log('🔍 Debug Supabase:', {
      temSupabaseLib: typeof supabase !== 'undefined',
      temCONFIG: typeof CONFIG !== 'undefined',
      url: this.url ? '✅ Configurado' : '❌ Vazio',
      anonKey: this.anonKey ? '✅ Configurado' : '❌ Vazio',
      temENV: typeof window !== 'undefined' && window.ENV ? '✅' : '❌'
    });
    
    // Inicializar cliente Supabase
    // Verificar se a biblioteca Supabase está disponível (pode ser supabase ou window.supabase)
    const supabaseLib = typeof supabase !== 'undefined' ? supabase : (typeof window !== 'undefined' && window.supabase ? window.supabase : null);
    
    if (supabaseLib && this.url && this.anonKey) {
      this.client = supabaseLib.createClient(this.url, this.anonKey);
      console.log('✅ Cliente Supabase inicializado com sucesso!', {
        url: this.url.substring(0, 30) + '...',
        keyLength: this.anonKey.length
      });
    } else {
      console.error('❌ Supabase não configurado:', {
        supabaseLib: supabaseLib ? '✅' : '❌',
        url: this.url ? '✅' : '❌',
        anonKey: this.anonKey ? '✅' : '❌',
        ENV: typeof window !== 'undefined' && window.ENV ? '✅' : '❌',
        CONFIG: typeof CONFIG !== 'undefined' ? '✅' : '❌'
      });
      this.client = null;
    }
  }

  // ==================== AUTENTICAÇÃO ====================
  
  /**
   * Tentar reinicializar o cliente (útil se o script carregou depois)
   */
  reinicializar() {
    const supabaseLib = typeof supabase !== 'undefined' ? supabase : (typeof window !== 'undefined' && window.supabase ? window.supabase : null);
    const url = CONFIG?.SUPABASE_URL || '';
    const anonKey = CONFIG?.SUPABASE_ANON_KEY || '';
    
    if (supabaseLib && url && anonKey && !this.client) {
      this.url = url;
      this.anonKey = anonKey;
      this.client = supabaseLib.createClient(url, anonKey);
      console.log('✅ Cliente Supabase reinicializado!');
      return true;
    }
    return false;
  }

  /**
   * Login com Google OAuth
   */
  async loginComGoogle() {
    // Tentar reinicializar se não estiver configurado
    if (!this.client) {
      console.log('🔄 Tentando reinicializar Supabase...');
      if (!this.reinicializar()) {
        throw new Error('Supabase não configurado. Verifique se as credenciais estão em js/env-dev.js');
      }
    }

    try {
      // Construir URL de callback usando CONFIG.buildPageUrl() para funcionar em dev e produção
      const callbackUrl = window.CONFIG 
        ? `${window.location.origin}${window.CONFIG.buildPageUrl('auth-callback.html')}`
        : `${window.location.origin}${CONFIG?.BASE_PATH || ''}pagina/auth-callback.html`;
      
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      });

      if (error) throw error;
      return { sucesso: true, data };
    } catch (erro) {
      console.error('❌ Erro no login Google:', erro);
      return { sucesso: false, erro: erro.message };
    }
  }

  /**
   * Verificar sessão atual
   */
  async verificarSessao() {
    if (!this.client) return null;

    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (erro) {
      console.error('❌ Erro ao verificar sessão:', erro);
      return null;
    }
  }

  /**
   * Logout
   */
  async logout() {
    if (!this.client) return;

    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      console.log('✅ Logout realizado');
    } catch (erro) {
      console.error('❌ Erro no logout:', erro);
    }
  }

  /**
   * Obter usuário atual
   */
  async getUsuarioAtual() {
    if (!this.client) return null;

    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error) throw error;
      return user;
    } catch (erro) {
      console.error('❌ Erro ao obter usuário:', erro);
      return null;
    }
  }

  // ==================== STORAGE (IMAGENS) ====================
  
  /**
   * Upload de imagem para Supabase Storage
   * @param {File} arquivo - Arquivo de imagem
   * @param {string} bucket - Nome do bucket (ex: 'imagens', 'devocionais')
   * @param {string} caminho - Caminho dentro do bucket (ex: 'devocionais/2025/')
   * @returns {Promise<string>} URL pública da imagem
   */
  async uploadImagem(arquivo, bucket = 'imagens', caminho = '') {
    if (!this.client) {
      throw new Error('Supabase não configurado');
    }

    try {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const nomeArquivo = `${caminho}${timestamp}_${arquivo.name}`;
      
      // Upload do arquivo
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(nomeArquivo, arquivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = this.client.storage
        .from(bucket)
        .getPublicUrl(nomeArquivo);

      // Construir URL completa manualmente se necessário
      let publicUrl = urlData.publicUrl;
      if (!publicUrl || !publicUrl.includes('supabase.co')) {
        // Fallback: construir URL manualmente
        publicUrl = `${this.url}/storage/v1/object/public/${bucket}/${nomeArquivo}`;
      }

      console.log('✅ Imagem enviada:', publicUrl);
      console.log('📁 Caminho completo:', `${bucket}/${nomeArquivo}`);
      return publicUrl;
    } catch (erro) {
      console.error('❌ Erro ao fazer upload:', erro);
      throw erro;
    }
  }

  /**
   * Deletar imagem do Storage
   */
  async deletarImagem(bucket, caminho) {
    if (!this.client) return;

    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove([caminho]);

      if (error) throw error;
      console.log('✅ Imagem deletada');
    } catch (erro) {
      console.error('❌ Erro ao deletar imagem:', erro);
      throw erro;
    }
  }

  // ==================== CRUD GENÉRICO ====================
  
  /**
   * Listar registros de uma tabela
   */
  async listar(tabela, filtros = {}) {
    if (!this.client) return [];

    try {
      let query = this.client.from(tabela).select('*');

      // Aplicar filtros
      if (filtros.ordem) {
        query = query.order(filtros.ordem.campo, { ascending: filtros.ordem.ascendente !== false });
      }

      if (filtros.limite) {
        query = query.limit(filtros.limite);
      }

      if (filtros.igual) {
        Object.entries(filtros.igual).forEach(([campo, valor]) => {
          query = query.eq(campo, valor);
        });
      }

      // Suporte para filtro com campo, operador e valor
      if (filtros.filtro) {
        const { campo, operador, valor } = filtros.filtro;
        if (campo && operador && valor !== undefined) {
          switch (operador.toLowerCase()) {
            case 'eq':
              query = query.eq(campo, valor);
              break;
            case 'neq':
              query = query.neq(campo, valor);
              break;
            case 'gt':
              query = query.gt(campo, valor);
              break;
            case 'gte':
              query = query.gte(campo, valor);
              break;
            case 'lt':
              query = query.lt(campo, valor);
              break;
            case 'lte':
              query = query.lte(campo, valor);
              break;
            case 'like':
              query = query.like(campo, `%${valor}%`);
              break;
            default:
              query = query.eq(campo, valor);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (erro) {
      console.error(`❌ Erro ao listar ${tabela}:`, erro);
      return [];
    }
  }

  /**
   * Buscar um registro por ID
   */
  async buscarPorId(tabela, id) {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from(tabela)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (erro) {
      console.error(`❌ Erro ao buscar ${tabela}:`, erro);
      return null;
    }
  }

  /**
   * Buscar usuário por auth_user_id
   */
  async buscarUsuarioPorAuthId(authUserId) {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) throw error;
      return data;
    } catch (erro) {
      console.error('❌ Erro ao buscar usuário:', erro);
      return null;
    }
  }

  /**
   * Criar novo registro
   */
  async criar(tabela, dados) {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from(tabela)
        .insert(dados)
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ Registro criado em ${tabela}`);
      return data;
    } catch (erro) {
      console.error(`❌ Erro ao criar em ${tabela}:`, erro);
      throw erro;
    }
  }

  /**
   * Atualizar registro
   */
  async atualizar(tabela, id, dados) {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from(tabela)
        .update(dados)
        .eq('id', id)
        .select();

      if (error) throw error;
      console.log(`✅ Registro atualizado em ${tabela}`);
      // Retornar o primeiro registro se houver múltiplos, ou o único registro
      return Array.isArray(data) ? data[0] : data;
    } catch (erro) {
      console.error(`❌ Erro ao atualizar em ${tabela}:`, erro);
      throw erro;
    }
  }

  /**
   * Deletar registro
   */
  async deletar(tabela, id) {
    if (!this.client) return false;

    try {
      const { error } = await this.client
        .from(tabela)
        .delete()
        .eq('id', id);

      if (error) throw error;
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
    const devocionais = await this.listar('devocionais', {
      igual: { ativo: true },
      ordem: { campo: 'data_publicacao', ascendente: false },
      limite: 1
    });
    return devocionais[0] || null;
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
}

// Instância global
const supabaseClient = new SupabaseClient();

// Exportar para uso global
window.supabaseClient = supabaseClient;
window.supabase = supabaseClient.client; // Para compatibilidade direta

