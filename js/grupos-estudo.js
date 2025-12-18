// ============================================
// GRUPOS-ESTUDO.JS - Sistema de Grupos de Estudo
// ============================================

/**
 * Componente Alpine.js para visualização de grupos de estudo
 */
function gruposEstudo() {
  return {
    grupos: [],
    carregando: true,
    filtroStatus: 'todos',
    filtroDia: 'todos',
    busca: '',
    grupoSelecionado: null,
    modalAberto: false,
    solicitandoEntrada: false,
    
    async init() {
      await this.carregarGrupos();
    },
    
    async carregarGrupos() {
      this.carregando = true;
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const tipoUsuario = this.obterTipoUsuario();
          
          let query = window.supabaseClient.client
            .from('grupos_estudo')
            .select(`
              *,
              lider:usuarios!grupos_estudo_lider_id_fkey(nome),
              membros:grupos_estudo_membros(count)
            `)
            .eq('ativo', true);
          
          // Filtrar por visibilidade se não for membro
          if (tipoUsuario === 'visitante') {
            query = query.eq('visibilidade', 'publico');
          }
          
          const { data, error } = await query.order('nome');
          
          if (error) throw error;
          
          // Processar dados
          this.grupos = (data || []).map(grupo => ({
            ...grupo,
            membros_count: grupo.membros?.[0]?.count || 0,
            vagas_disponiveis: grupo.max_membros - (grupo.membros?.[0]?.count || 0)
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
      } finally {
        this.carregando = false;
      }
    },
    
    get gruposFiltrados() {
      return this.grupos.filter(g => {
        // Filtro de status
        if (this.filtroStatus !== 'todos' && g.status !== this.filtroStatus) {
          return false;
        }
        
        // Filtro de dia
        if (this.filtroDia !== 'todos' && g.dia_semana !== this.filtroDia) {
          return false;
        }
        
        // Busca
        if (this.busca.trim()) {
          const termoBusca = this.busca.toLowerCase();
          return (
            g.nome.toLowerCase().includes(termoBusca) ||
            (g.tema && g.tema.toLowerCase().includes(termoBusca)) ||
            (g.descricao && g.descricao.toLowerCase().includes(termoBusca))
          );
        }
        
        return true;
      });
    },
    
    verDetalhes(grupo) {
      this.grupoSelecionado = grupo;
      this.modalAberto = true;
    },
    
    fecharModal() {
      this.modalAberto = false;
      this.grupoSelecionado = null;
    },
    
    async solicitarEntrada(grupo) {
      const usuarioId = this.obterUsuarioId();
      
      if (!usuarioId) {
        if (window.mostrarToast) {
          window.mostrarToast('Você precisa estar logado para participar de um grupo', 'aviso');
        }
        return;
      }
      
      this.solicitandoEntrada = true;
      
      try {
        // Verificar se já é membro
        const { data: jaMembro } = await window.supabaseClient.client
          .from('grupos_estudo_membros')
          .select('id')
          .eq('grupo_id', grupo.id)
          .eq('usuario_id', usuarioId)
          .maybeSingle();
        
        if (jaMembro) {
          if (window.mostrarToast) {
            window.mostrarToast('Você já faz parte deste grupo', 'info');
          }
          return;
        }
        
        // Verificar vagas
        if (grupo.vagas_disponiveis <= 0) {
          if (window.mostrarToast) {
            window.mostrarToast('Este grupo não tem vagas disponíveis', 'aviso');
          }
          return;
        }
        
        // Criar solicitação de entrada
        const status = grupo.requer_aprovacao ? 'pendente' : 'aprovado';
        
        const { error } = await window.supabaseClient.client
          .from('grupos_estudo_membros')
          .insert({
            grupo_id: grupo.id,
            usuario_id: usuarioId,
            status: status
          });
        
        if (error) throw error;
        
        if (status === 'aprovado') {
          if (window.mostrarToast) {
            window.mostrarToast('Você agora faz parte do grupo!', 'sucesso');
          }
        } else {
          if (window.mostrarToast) {
            window.mostrarToast('Solicitação enviada! Aguarde aprovação do líder.', 'sucesso');
          }
        }
        
        // Notificar líder
        if (grupo.lider_id) {
          await this.notificarLider(grupo);
        }
        
        this.fecharModal();
        await this.carregarGrupos();
      } catch (error) {
        console.error('Erro ao solicitar entrada:', error);
        if (window.mostrarToast) {
          window.mostrarToast('Erro ao processar solicitação', 'erro');
        }
      } finally {
        this.solicitandoEntrada = false;
      }
    },
    
    async notificarLider(grupo) {
      try {
        const usuario = this.obterUsuario();
        await window.supabaseClient.client
          .from('notificacoes')
          .insert({
            titulo: 'Nova Solicitação no Grupo',
            mensagem: `${usuario?.nome || 'Um usuário'} quer participar do grupo "${grupo.nome}".`,
            tipo: 'grupo',
            nivel_acesso: 'membro',
            dados_extras: { grupo_id: grupo.id }
          });
      } catch (error) {
        console.error('Erro ao notificar líder:', error);
      }
    },
    
    obterTipoUsuario() {
      const usuario = localStorage.getItem('ipvida_usuario');
      if (usuario) {
        try {
          return JSON.parse(usuario).tipo || 'visitante';
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
          return JSON.parse(usuario).id || null;
        } catch {
          return null;
        }
      }
      return null;
    },
    
    obterUsuario() {
      const usuario = localStorage.getItem('ipvida_usuario');
      if (usuario) {
        try {
          return JSON.parse(usuario);
        } catch {
          return null;
        }
      }
      return null;
    },
    
    formatarDiaSemana(dia) {
      const dias = {
        'domingo': 'Domingo',
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado'
      };
      return dias[dia] || dia;
    },
    
    getStatusBadge(status) {
      const badges = {
        'aberto': 'badge-success',
        'em_andamento': 'badge-primary',
        'fechado': 'badge-warning',
        'encerrado': 'badge-secondary'
      };
      return badges[status] || 'badge-secondary';
    }
  };
}

/**
 * Componente Alpine.js para admin de grupos de estudo
 */
function adminGruposEstudo() {
  return {
    grupos: [],
    creditos: [],
    membros: [],
    carregando: true,
    abaAtiva: 'grupos',
    
    // Formulário de grupo
    grupoEditando: null,
    formularioGrupo: {
      nome: '',
      descricao: '',
      tema: '',
      dia_semana: '',
      horario: '',
      local: '',
      tipo: 'presencial',
      link_online: '',
      max_membros: 12,
      lider_id: '',
      co_lider_id: '',
      requer_aprovacao: true,
      visibilidade: 'publico'
    },
    
    // Modal
    modalAberto: false,
    modalMembrosAberto: false,
    grupoMembros: null,
    
    async init() {
      await this.carregarDados();
    },
    
    async carregarDados() {
      this.carregando = true;
      try {
        await Promise.all([
          this.carregarGrupos(),
          this.carregarCreditos()
        ]);
      } finally {
        this.carregando = false;
      }
    },
    
    async carregarGrupos() {
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .from('grupos_estudo')
            .select(`
              *,
              lider:usuarios!grupos_estudo_lider_id_fkey(id, nome),
              membros:grupos_estudo_membros(count)
            `)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          this.grupos = (data || []).map(grupo => ({
            ...grupo,
            membros_count: grupo.membros?.[0]?.count || 0
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar grupos:', error);
      }
    },
    
    async carregarCreditos() {
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .from('creditos_grupos')
            .select(`
              *,
              usuario:usuarios(nome, email)
            `)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          this.creditos = data || [];
        }
      } catch (error) {
        console.error('Erro ao carregar créditos:', error);
      }
    },
    
    abrirNovoGrupo() {
      this.grupoEditando = null;
      this.formularioGrupo = {
        nome: '',
        descricao: '',
        tema: '',
        dia_semana: '',
        horario: '',
        local: '',
        tipo: 'presencial',
        link_online: '',
        max_membros: 12,
        lider_id: '',
        co_lider_id: '',
        requer_aprovacao: true,
        visibilidade: 'publico'
      };
      this.modalAberto = true;
    },
    
    editarGrupo(grupo) {
      this.grupoEditando = grupo;
      this.formularioGrupo = {
        nome: grupo.nome,
        descricao: grupo.descricao || '',
        tema: grupo.tema || '',
        dia_semana: grupo.dia_semana || '',
        horario: grupo.horario || '',
        local: grupo.local || '',
        tipo: grupo.tipo || 'presencial',
        link_online: grupo.link_online || '',
        max_membros: grupo.max_membros || 12,
        lider_id: grupo.lider_id || '',
        co_lider_id: grupo.co_lider_id || '',
        requer_aprovacao: grupo.requer_aprovacao !== false,
        visibilidade: grupo.visibilidade || 'publico'
      };
      this.modalAberto = true;
    },
    
    async salvarGrupo() {
      try {
        const dados = {
          nome: this.formularioGrupo.nome,
          descricao: this.formularioGrupo.descricao || null,
          tema: this.formularioGrupo.tema || null,
          dia_semana: this.formularioGrupo.dia_semana || null,
          horario: this.formularioGrupo.horario || null,
          local: this.formularioGrupo.local || null,
          tipo: this.formularioGrupo.tipo,
          link_online: this.formularioGrupo.link_online || null,
          max_membros: this.formularioGrupo.max_membros,
          lider_id: this.formularioGrupo.lider_id || null,
          co_lider_id: this.formularioGrupo.co_lider_id || null,
          requer_aprovacao: this.formularioGrupo.requer_aprovacao,
          visibilidade: this.formularioGrupo.visibilidade
        };
        
        if (this.grupoEditando) {
          // Atualizar
          const { error } = await window.supabaseClient.client
            .from('grupos_estudo')
            .update(dados)
            .eq('id', this.grupoEditando.id);
          
          if (error) throw error;
          
          if (window.mostrarToast) {
            window.mostrarToast('Grupo atualizado com sucesso', 'sucesso');
          }
        } else {
          // Criar
          const { error } = await window.supabaseClient.client
            .from('grupos_estudo')
            .insert(dados);
          
          if (error) throw error;
          
          if (window.mostrarToast) {
            window.mostrarToast('Grupo criado com sucesso', 'sucesso');
          }
        }
        
        this.fecharModal();
        await this.carregarGrupos();
      } catch (error) {
        console.error('Erro ao salvar grupo:', error);
        if (window.mostrarToast) {
          window.mostrarToast('Erro ao salvar grupo', 'erro');
        }
      }
    },
    
    async alternarAtivo(grupo) {
      try {
        const { error } = await window.supabaseClient.client
          .from('grupos_estudo')
          .update({ ativo: !grupo.ativo })
          .eq('id', grupo.id);
        
        if (error) throw error;
        
        grupo.ativo = !grupo.ativo;
      } catch (error) {
        console.error('Erro ao alterar status:', error);
      }
    },
    
    async excluirGrupo(grupo) {
      if (!confirm('Tem certeza que deseja excluir este grupo?')) return;
      
      try {
        const { error } = await window.supabaseClient.client
          .from('grupos_estudo')
          .delete()
          .eq('id', grupo.id);
        
        if (error) throw error;
        
        this.grupos = this.grupos.filter(g => g.id !== grupo.id);
        
        if (window.mostrarToast) {
          window.mostrarToast('Grupo excluído', 'sucesso');
        }
      } catch (error) {
        console.error('Erro ao excluir grupo:', error);
      }
    },
    
    async verMembros(grupo) {
      this.grupoMembros = grupo;
      
      try {
        const { data, error } = await window.supabaseClient.client
          .from('grupos_estudo_membros')
          .select(`
            *,
            usuario:usuarios(id, nome, email)
          `)
          .eq('grupo_id', grupo.id)
          .order('created_at');
        
        if (error) throw error;
        
        this.membros = data || [];
        this.modalMembrosAberto = true;
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
      }
    },
    
    async atualizarStatusMembro(membro, novoStatus) {
      try {
        const { error } = await window.supabaseClient.client
          .from('grupos_estudo_membros')
          .update({ status: novoStatus })
          .eq('id', membro.id);
        
        if (error) throw error;
        
        membro.status = novoStatus;
        
        if (window.mostrarToast) {
          window.mostrarToast('Status atualizado', 'sucesso');
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    },
    
    async removerMembro(membro) {
      if (!confirm('Remover este membro do grupo?')) return;
      
      try {
        const { error } = await window.supabaseClient.client
          .from('grupos_estudo_membros')
          .delete()
          .eq('id', membro.id);
        
        if (error) throw error;
        
        this.membros = this.membros.filter(m => m.id !== membro.id);
        
        // Atualizar contagem
        const grupo = this.grupos.find(g => g.id === this.grupoMembros.id);
        if (grupo) {
          grupo.membros_count--;
        }
      } catch (error) {
        console.error('Erro ao remover membro:', error);
      }
    },
    
    fecharModal() {
      this.modalAberto = false;
      this.grupoEditando = null;
    },
    
    fecharModalMembros() {
      this.modalMembrosAberto = false;
      this.grupoMembros = null;
      this.membros = [];
    },
    
    formatarDiaSemana(dia) {
      const dias = {
        'domingo': 'Dom',
        'segunda': 'Seg',
        'terca': 'Ter',
        'quarta': 'Qua',
        'quinta': 'Qui',
        'sexta': 'Sex',
        'sabado': 'Sáb'
      };
      return dias[dia] || dia;
    },
    
    getStatusBadge(status) {
      const badges = {
        'aberto': 'badge-success',
        'em_andamento': 'badge-primary',
        'fechado': 'badge-warning',
        'encerrado': 'badge-secondary'
      };
      return badges[status] || 'badge-secondary';
    },
    
    getMembroStatusBadge(status) {
      const badges = {
        'pendente': 'badge-warning',
        'aprovado': 'badge-success',
        'recusado': 'badge-danger'
      };
      return badges[status] || 'badge-secondary';
    }
  };
}

/**
 * Sistema de créditos para grupos
 */
function creditosGrupos() {
  return {
    creditos: null,
    historicoUso: [],
    carregando: true,
    
    async init() {
      await this.carregarCreditos();
    },
    
    async carregarCreditos() {
      this.carregando = true;
      const usuarioId = this.obterUsuarioId();
      
      if (!usuarioId) {
        this.carregando = false;
        return;
      }
      
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          // Buscar créditos do usuário
          const { data, error } = await window.supabaseClient.client
            .from('creditos_grupos')
            .select('*')
            .eq('usuario_id', usuarioId)
            .maybeSingle();
          
          if (error) throw error;
          
          this.creditos = data;
          
          // Se tiver créditos, carregar histórico
          if (data) {
            await this.carregarHistorico(data.id);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar créditos:', error);
      } finally {
        this.carregando = false;
      }
    },
    
    async carregarHistorico(creditoId) {
      try {
        // Para este exemplo, vamos buscar os grupos criados pelo usuário
        const { data, error } = await window.supabaseClient.client
          .from('grupos_estudo')
          .select('id, nome, created_at')
          .eq('lider_id', this.obterUsuarioId())
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        this.historicoUso = (data || []).map(g => ({
          tipo: 'criacao_grupo',
          descricao: `Criação do grupo "${g.nome}"`,
          data: g.created_at,
          quantidade: 1
        }));
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    },
    
    podecriarGrupo() {
      return this.creditos && this.creditos.grupos_disponiveis > 0;
    },
    
    obterUsuarioId() {
      const usuario = localStorage.getItem('ipvida_usuario');
      if (usuario) {
        try {
          return JSON.parse(usuario).id || null;
        } catch {
          return null;
        }
      }
      return null;
    },
    
    formatarData(data) {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR');
    }
  };
}

// Registrar componentes globalmente
window.gruposEstudo = gruposEstudo;
window.adminGruposEstudo = adminGruposEstudo;
window.creditosGrupos = creditosGrupos;

