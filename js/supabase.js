// ============================================
// SUPABASE.JS - Cliente usando Edge Functions
// ============================================
// Todas as operações passam pelas Edge Functions
// Nenhuma credencial exposta no código!

class SupabaseClient {
  constructor() {
    // Apenas a URL do Supabase (pública)
    this.url = CONFIG?.SUPABASE_URL || window.SUPABASE_CONFIG?.SUPABASE_URL || '';
    this.client = null; // Não usamos mais o cliente direto
    
    console.log('✅ Supabase Client inicializado (usando Edge Functions)');
    console.log(`📍 URL: ${this.url ? 'Configurado' : '❌ Não configurado'}`);
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
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // ==================== COMPATIBILIDADE (para código existente) ====================
  
  /**
   * Métodos de autenticação - ainda precisam do cliente direto
   * Para autenticação, precisamos usar o cliente com anon key (isso é seguro)
   */
  async loginComGoogle() {
    console.warn('⚠️ Autenticação ainda não implementada via Edge Functions');
    throw new Error('Autenticação precisa ser implementada separadamente');
  }

  async verificarSessao() {
    return null;
  }

  async logout() {
    return;
  }

  async getUsuarioAtual() {
    return null;
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

// Instância global
const supabaseClient = new SupabaseClient();

// Exportar para uso global
window.supabaseClient = supabaseClient;
window.supabase = null; // Não usamos mais o cliente direto
