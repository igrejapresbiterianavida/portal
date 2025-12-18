// ============================================
// AVISOS-POPUP.JS - Sistema de Pop-ups/Avisos
// ============================================

/**
 * Componente Alpine.js para sistema de avisos pop-up
 */
function sistemaAvisosPopup() {
  return {
    avisos: [],
    avisoAtual: null,
    indiceAtual: 0,
    mostrarModal: false,
    carregando: true,
    
    async init() {
      await this.carregarAvisos();
    },
    
    async carregarAvisos() {
      this.carregando = true;
      
      try {
        const tipoUsuario = this.obterTipoUsuario();
        const sessaoId = this.obterSessaoId();
        const usuarioId = this.obterUsuarioId();
        
        if (window.supabaseClient && window.supabaseClient.client) {
          // Buscar avisos ativos
          let query = window.supabaseClient.client
            .from('avisos_popup')
            .select('*')
            .eq('ativo', true)
            .lte('data_inicio', new Date().toISOString())
            .or(`data_fim.is.null,data_fim.gte.${new Date().toISOString()}`);
          
          // Filtrar por nível de acesso
          if (tipoUsuario === 'visitante') {
            query = query.eq('nivel_acesso', 'publico');
          }
          
          const { data: avisos, error } = await query.order('prioridade', { ascending: false });
          
          if (error) throw error;
          
          // Filtrar avisos já lidos/fechados
          const avisosParaMostrar = [];
          
          for (const aviso of avisos || []) {
            const foiLido = await this.verificarSeJaLido(aviso.id, usuarioId, sessaoId);
            if (!foiLido) {
              avisosParaMostrar.push(aviso);
            }
          }
          
          this.avisos = avisosParaMostrar;
          
          // Mostrar primeiro aviso se houver
          if (this.avisos.length > 0) {
            this.avisoAtual = this.avisos[0];
            this.indiceAtual = 0;
            this.mostrarModal = true;
          }
        }
      } catch (error) {
        console.error('Erro ao carregar avisos:', error);
      } finally {
        this.carregando = false;
      }
    },
    
    async verificarSeJaLido(avisoId, usuarioId, sessaoId) {
      try {
        let query = window.supabaseClient.client
          .from('avisos_usuarios')
          .select('id, status')
          .eq('aviso_id', avisoId);
        
        if (usuarioId) {
          query = query.eq('usuario_id', usuarioId);
        } else {
          query = query.eq('sessao_id', sessaoId);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (error) return false;
        
        // Se já marcou como lido, não mostrar mais
        if (data && data.status === 'lido') {
          return true;
        }
        
        // Se apenas fechou, não retorna como lido (será mostrado novamente)
        return false;
      } catch (error) {
        return false;
      }
    },
    
    async marcarComoLido() {
      if (!this.avisoAtual) return;
      
      await this.registrarAcao('lido');
      this.proximoAviso();
    },
    
    async fecharAviso() {
      if (!this.avisoAtual) return;
      
      await this.registrarAcao('fechado');
      this.proximoAviso();
    },
    
    async registrarAcao(status) {
      try {
        const sessaoId = this.obterSessaoId();
        const usuarioId = this.obterUsuarioId();
        
        const dados = {
          aviso_id: this.avisoAtual.id,
          status: status,
          sessao_id: sessaoId
        };
        
        if (usuarioId) {
          dados.usuario_id = usuarioId;
        }
        
        // Verificar se já existe registro
        let query = window.supabaseClient.client
          .from('avisos_usuarios')
          .select('id')
          .eq('aviso_id', this.avisoAtual.id);
        
        if (usuarioId) {
          query = query.eq('usuario_id', usuarioId);
        } else {
          query = query.eq('sessao_id', sessaoId);
        }
        
        const { data: existente } = await query.maybeSingle();
        
        if (existente) {
          // Atualizar registro existente
          await window.supabaseClient.client
            .from('avisos_usuarios')
            .update({ status: status })
            .eq('id', existente.id);
        } else {
          // Criar novo registro
          await window.supabaseClient.client
            .from('avisos_usuarios')
            .insert(dados);
        }
      } catch (error) {
        console.error('Erro ao registrar ação:', error);
      }
    },
    
    proximoAviso() {
      this.indiceAtual++;
      
      if (this.indiceAtual < this.avisos.length) {
        this.avisoAtual = this.avisos[this.indiceAtual];
      } else {
        this.fecharModal();
      }
    },
    
    fecharModal() {
      this.mostrarModal = false;
      this.avisoAtual = null;
    },
    
    obterTipoUsuario() {
      const usuario = localStorage.getItem('ipvida_usuario');
      if (usuario) {
        try {
          const parsed = JSON.parse(usuario);
          return parsed.tipo || 'visitante';
        } catch {
          return 'visitante';
        }
      }
      return 'visitante';
    },
    
    obterUsuarioId() {
      const usuario = localStorage.getItem('ipvida_usuario');
      if (usuario) {
        try {
          const parsed = JSON.parse(usuario);
          return parsed.id || null;
        } catch {
          return null;
        }
      }
      return null;
    },
    
    obterSessaoId() {
      let sessaoId = sessionStorage.getItem('ipvida_sessao_id');
      if (!sessaoId) {
        sessaoId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('ipvida_sessao_id', sessaoId);
      }
      return sessaoId;
    },
    
    formatarData(data) {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR');
    },
    
    getTipoClasse() {
      if (!this.avisoAtual) return '';
      const tipo = this.avisoAtual.tipo || 'info';
      return `aviso-popup--${tipo}`;
    },
    
    getTipoIcone() {
      if (!this.avisoAtual) return 'bi-info-circle';
      const icones = {
        'info': 'bi-info-circle',
        'sucesso': 'bi-check-circle',
        'aviso': 'bi-exclamation-triangle',
        'urgente': 'bi-exclamation-circle'
      };
      return icones[this.avisoAtual.tipo] || 'bi-info-circle';
    }
  };
}

// Registrar componente globalmente
window.sistemaAvisosPopup = sistemaAvisosPopup;

