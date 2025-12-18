// ============================================
// CATECUMENOS.JS - Sistema de Inscrição Catecúmenos
// Com Cards de Turmas + Formulário
// ============================================

/**
 * Componente Alpine.js para sistema de catecúmenos
 * Mostra cards de turmas primeiro, depois formulário
 */
function inscricaoCatecumeno() {
  return {
    // Estados da tela
    tela: 'turmas', // 'turmas', 'formulario', 'sucesso'
    carregandoTurmas: true,
    turmas: [],
    turmaSelecionada: null,
    
    // Verificar inscrição do usuário
    minhaInscricao: null,
    minhaTurma: null,
    
    // Formulário
    etapaAtual: 1,
    totalEtapas: 3,
    carregando: false,
    erro: null,
    
    formulario: {
      nome: '',
      email: '',
      telefone: '',
      data_nascimento: '',
      endereco: '',
      estado_civil: '',
      profissao: '',
      como_conheceu: '',
      ja_batizado: false,
      igreja_anterior: '',
      motivacao: '',
      disponibilidade: '',
      turma_id: '',
      aceita_termos: false
    },
    
    erros: {},
    
    async init() {
      await this.carregarTurmas();
      await this.verificarMinhaInscricao();
    },
    
    /**
     * Verifica se o usuário logado já está inscrito em uma turma
     */
    async verificarMinhaInscricao() {
      try {
        const usuarioId = this.obterUsuarioId();
        if (!usuarioId || !window.supabaseClient || !window.supabaseClient.client) return;
        
        // Buscar inscrição do usuário
        const { data, error } = await window.supabaseClient.client
          .from('catecumenos')
          .select('*, turma:turmas_catecumenos(*)')
          .eq('usuario_id', usuarioId)
          .in('status', ['pendente', 'aprovado', 'em_andamento'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!error && data) {
          this.minhaInscricao = data;
          this.minhaTurma = data.turma;
          console.log('✅ Inscrição encontrada:', data.turma?.nome);
        }
      } catch (error) {
        // Usuário não está inscrito - comportamento normal
        this.minhaInscricao = null;
        this.minhaTurma = null;
      }
    },
    
    /**
     * Verifica se o usuário está inscrito em uma turma específica
     */
    estaInscritoNaTurma(turmaId) {
      return this.minhaInscricao && this.minhaInscricao.turma_id === turmaId;
    },
    
    /**
     * Abre o link do Google Meet da turma
     */
    acessarSala(turma) {
      if (turma.link_google_meet) {
        window.open(turma.link_google_meet, '_blank');
      } else {
        alert('O link da sala ainda não foi configurado. Entre em contato com a secretaria da igreja.');
      }
    },
    
    /**
     * Abre o grupo do WhatsApp da turma
     */
    entrarGrupoWhatsApp(turma) {
      if (turma.link_whatsapp) {
        window.open(turma.link_whatsapp, '_blank');
      } else {
        alert('O grupo do WhatsApp ainda não foi configurado. Entre em contato com a secretaria da igreja.');
      }
    },
    
    /**
     * Verifica se o usuário está logado
     */
    usuarioLogado() {
      if (window.auth && auth.verificarSessaoAtiva && auth.verificarSessaoAtiva()) {
        return true;
      }
      const usuario = localStorage.getItem('ipvida_usuario');
      return usuario !== null;
    },
    
    /**
     * Verifica se a aula está no horário (pode acessar a sala)
     */
    podeAcessarSala(turma) {
      if (!turma.dia_semana || !turma.horario) return true; // Se não tem horário definido, libera sempre
      
      const agora = new Date();
      const diaAtual = agora.getDay(); // 0-6 (domingo-sábado)
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      
      // Mapear dia da semana
      const diasMap = {
        'domingo': 0,
        'segunda': 1,
        'terca': 2,
        'quarta': 3,
        'quinta': 4,
        'sexta': 5,
        'sabado': 6
      };
      
      const diaTurma = diasMap[turma.dia_semana.toLowerCase()];
      if (diaTurma !== diaAtual) return false; // Não é o dia da aula
      
      // Pegar horário da turma (formato: "19:30")
      const [horaTurma, minutoTurma] = turma.horario.split(':').map(Number);
      
      // Libera 15 minutos antes da aula
      const minutosAntesDaAula = 15;
      const horaAulaEmMinutos = horaTurma * 60 + minutoTurma;
      const horaAtualEmMinutos = horaAtual * 60 + minutoAtual;
      
      // Aula disponível de 15min antes até 2h depois do início
      const podeAcessar = horaAtualEmMinutos >= (horaAulaEmMinutos - minutosAntesDaAula) && 
                          horaAtualEmMinutos <= (horaAulaEmMinutos + 120);
      
      return podeAcessar;
    },
    
    /**
     * Retorna mensagem de quando a aula estará disponível
     */
    getMensagemDisponibilidade(turma) {
      if (!turma.dia_semana || !turma.horario) return '';
      
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const diasMap = {
        'domingo': 0,
        'segunda': 1,
        'terca': 2,
        'quarta': 3,
        'quinta': 4,
        'sexta': 5,
        'sabado': 6
      };
      
      const agora = new Date();
      const diaAtual = agora.getDay();
      const diaTurma = diasMap[turma.dia_semana.toLowerCase()];
      
      if (diaAtual === diaTurma) {
        const [horaTurma, minutoTurma] = turma.horario.split(':').map(Number);
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();
        const horaAulaEmMinutos = horaTurma * 60 + minutoTurma;
        const horaAtualEmMinutos = horaAtual * 60 + minutoAtual;
        
        if (horaAtualEmMinutos < horaAulaEmMinutos - 15) {
          return `Aula disponível às ${turma.horario}`;
        }
        if (horaAtualEmMinutos > horaAulaEmMinutos + 120) {
          return `Aula já encerrada. Próxima: ${diasSemana[diaTurma]}`;
        }
      } else {
        return `Próxima aula: ${diasSemana[diaTurma]} às ${turma.horario}`;
      }
      
      return '';
    },
    
    /**
     * Retorna o texto do botão baseado no status de inscrição e login
     */
    getTextoBotao(turma) {
      // Se não está logado
      if (!this.usuarioLogado()) {
        return 'Criar Conta para Inscrever-se';
      }
      
      // Se já está inscrito
      if (this.estaInscritoNaTurma(turma.id)) {
        if (this.podeAcessarSala(turma)) {
          return 'Acessar Aula';
        } else {
          return 'Aguardando Horário';
        }
      }
      
      // Se turma está lotada
      if (turma.vagas_disponiveis <= 0) {
        return 'Turma Lotada';
      }
      
      // Pode se inscrever
      return 'Inscrever-me Agora';
    },
    
    /**
     * Retorna o ícone do botão baseado no status de inscrição
     */
    getIconeBotao(turma) {
      if (!this.usuarioLogado()) {
        return 'person_add';
      }
      
      if (this.estaInscritoNaTurma(turma.id)) {
        if (this.podeAcessarSala(turma)) {
          return 'videocam';
        } else {
          return 'schedule';
        }
      }
      
      if (turma.vagas_disponiveis <= 0) {
        return 'block';
      }
      
      return 'how_to_reg';
    },
    
    /**
     * Verifica se o botão deve estar desabilitado
     */
    botaoDesabilitado(turma) {
      // Turma lotada
      if (turma.vagas_disponiveis <= 0 && !this.estaInscritoNaTurma(turma.id)) {
        return true;
      }
      
      // Já inscrito mas não está no horário
      if (this.estaInscritoNaTurma(turma.id) && !this.podeAcessarSala(turma)) {
        return true;
      }
      
      return false;
    },
    
    /**
     * Ação do botão principal da turma
     */
    async acaoPrincipal(turma) {
      // Se não está logado, redireciona para criar conta
      if (!this.usuarioLogado()) {
        if (window.mostrarModalLogin) {
          window.mostrarModalLogin();
        } else {
          alert('Por favor, crie uma conta ou faça login para se inscrever.');
          window.location.href = '/index.html#login';
        }
        return;
      }
      
      // Se já está inscrito, abre a sala (se estiver no horário)
      if (this.estaInscritoNaTurma(turma.id)) {
        if (this.podeAcessarSala(turma)) {
          this.acessarSala(turma);
        } else {
          alert(this.getMensagemDisponibilidade(turma));
        }
        return;
      }
      
      // Se turma lotada
      if (turma.vagas_disponiveis <= 0) {
        alert('Esta turma está lotada. Por favor, escolha outra turma.');
        return;
      }
      
      // Fazer inscrição automática com dados do usuário logado
      await this.inscreverComDadosUsuario(turma);
    },
    
    /**
     * Inscreve o usuário automaticamente usando seus dados cadastrados
     */
    async inscreverComDadosUsuario(turma) {
      try {
        this.carregando = true;
        
        // Pegar dados do usuário logado
        const usuario = window.auth && auth.usuario ? auth.usuario : JSON.parse(localStorage.getItem('ipvida_usuario'));
        
        if (!usuario) {
          alert('Erro ao obter dados do usuário. Por favor, faça login novamente.');
          return;
        }
        
        console.log('📝 Dados do usuário para inscrição:', usuario);
        
        // Verificar se tem nome (obrigatório)
        const nome = usuario.nome || (usuario.email ? usuario.email.split('@')[0] : 'Usuário');
        
        // Preparar dados da inscrição - apenas campos essenciais
        const dadosInscricao = {
          nome: nome,
          email: usuario.email || null,
          turma_id: turma.id,
          status: turma.requer_aprovacao ? 'pendente' : 'aprovado'
        };
        
        // Adicionar telefone se existir
        if (usuario.telefone) {
          dadosInscricao.telefone = usuario.telefone;
        }
        
        // Adicionar usuario_id somente se existir
        if (usuario.id) {
          dadosInscricao.usuario_id = usuario.id;
        }
        
        console.log('📝 Dados da inscrição:', dadosInscricao);
        
        // Salvar inscrição
        const { data, error } = await window.supabaseClient.client
          .from('catecumenos')
          .insert(dadosInscricao)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Erro Supabase:', error);
          throw error;
        }
        
        // Atualizar estado local
        this.minhaInscricao = data;
        this.minhaTurma = turma;
        
        // Recarregar turmas para atualizar contadores
        await this.carregarTurmas();
        await this.verificarMinhaInscricao();
        
        // Mostrar mensagem de sucesso
        const mensagem = turma.requer_aprovacao 
          ? 'Inscrição realizada com sucesso! Aguarde a aprovação da secretaria.'
          : 'Inscrição confirmada! Você já pode acessar a aula no horário agendado.';
        
        alert(mensagem);
        
        console.log('✅ Inscrição automática realizada com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao realizar inscrição:', error);
        
        // Mensagens de erro mais específicas
        let mensagemErro = 'Erro ao realizar inscrição. ';
        if (error.message) {
          if (error.message.includes('duplicate')) {
            mensagemErro = 'Você já está inscrito nesta turma!';
          } else if (error.message.includes('violates not-null')) {
            mensagemErro += 'Complete seu perfil antes de se inscrever (nome, telefone).';
          } else {
            mensagemErro += error.message;
          }
        } else {
          mensagemErro += 'Por favor, tente novamente ou preencha o formulário manualmente.';
        }
        
        alert(mensagemErro);
      } finally {
        this.carregando = false;
      }
    },
    
    async carregarTurmas() {
      this.carregandoTurmas = true;
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          // Buscar turmas com campos de links
          const { data: turmasData, error: turmasError } = await window.supabaseClient.client
            .from('turmas_catecumenos')
            .select('*, link_google_meet, link_whatsapp, nivel_acesso')
            .eq('ativo', true)
            .in('status', ['aberta', 'em_andamento'])
            .order('data_inicio', { ascending: true });
          
          if (turmasError) throw turmasError;
          
          // Buscar contagem de inscritos por turma
          const { data: inscritosData, error: inscritosError } = await window.supabaseClient.client
            .from('catecumenos')
            .select('turma_id')
            .not('turma_id', 'is', null);
          
          // Contar inscritos por turma
          const contagem = {};
          if (inscritosData) {
            inscritosData.forEach(i => {
              contagem[i.turma_id] = (contagem[i.turma_id] || 0) + 1;
            });
          }
          
          // Adicionar contagem às turmas
          let turmasComContagem = (turmasData || []).map(turma => ({
            ...turma,
            inscritos: contagem[turma.id] || 0,
            vagas_disponiveis: turma.vagas - (contagem[turma.id] || 0),
            link_google_meet: turma.link_google_meet || null,
            link_whatsapp: turma.link_whatsapp || null
          }));
          
          // FILTRAR POR NÍVEL DE ACESSO
          if (window.controleAcesso) {
            this.turmas = window.controleAcesso.filtrarPorAcesso(turmasComContagem, 'nivel_acesso');
            console.log('✅ Turmas carregadas (após filtro de acesso):', this.turmas.length);
          } else {
            // Fallback: filtrar manualmente
            this.turmas = turmasComContagem.filter(turma => {
              if (!turma.nivel_acesso || turma.nivel_acesso.length === 0) return true;
              if (turma.nivel_acesso.includes('visitante')) return true;
              
              const tipoUsuario = this.obterTipoUsuario();
              if (tipoUsuario === 'administracao') return true;
              if (turma.nivel_acesso.includes('membro') && ['membro', 'lideranca', 'administracao'].includes(tipoUsuario)) return true;
              if (turma.nivel_acesso.includes('lideranca') && ['lideranca', 'administracao'].includes(tipoUsuario)) return true;
              
              return false;
            });
            console.log('✅ Turmas carregadas (filtro fallback):', this.turmas.length);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        this.turmas = [];
      } finally {
        this.carregandoTurmas = false;
      }
    },
    
    /**
     * Obtém o tipo do usuário atual
     */
    obterTipoUsuario() {
      if (window.controleAcesso) {
        return window.controleAcesso.obterTipoUsuario();
      }
      
      try {
        const usuario = localStorage.getItem('ipvida_usuario');
        if (usuario) {
          return JSON.parse(usuario).tipo || 'visitante';
        }
      } catch {
        // Ignora erros
      }
      return 'visitante';
    },
    
    selecionarTurma(turma) {
      if (turma.vagas_disponiveis <= 0) {
        alert('Esta turma está lotada. Por favor, escolha outra.');
        return;
      }
      this.turmaSelecionada = turma;
      this.formulario.turma_id = turma.id;
      this.tela = 'formulario';
    },
    
    voltarParaTurmas() {
      this.tela = 'turmas';
      this.turmaSelecionada = null;
      this.etapaAtual = 1;
      this.erros = {};
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
    
    formatarData(data) {
      if (!data) return '';
      return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
    },
    
    getStatusTurma(turma) {
      if (turma.vagas_disponiveis <= 0) return 'lotada';
      if (turma.vagas_disponiveis <= 3) return 'poucas';
      return 'disponivel';
    },
    
    getStatusTextoTurma(turma) {
      if (turma.vagas_disponiveis <= 0) return 'Lotada';
      if (turma.vagas_disponiveis <= 3) return 'Poucas vagas';
      return `${turma.vagas_disponiveis} vagas`;
    },
    
    // ========== VALIDAÇÃO ==========
    validarEtapa(etapa) {
      this.erros = {};
      
      if (etapa === 1) {
        if (!this.formulario.nome.trim()) {
          this.erros.nome = 'Nome é obrigatório';
        }
        if (!this.formulario.telefone.trim()) {
          this.erros.telefone = 'Telefone é obrigatório';
        } else if (!this.validarTelefone(this.formulario.telefone)) {
          this.erros.telefone = 'Telefone inválido';
        }
        if (this.formulario.email && !this.validarEmail(this.formulario.email)) {
          this.erros.email = 'Email inválido';
        }
      }
      
      if (etapa === 2) {
        if (!this.formulario.motivacao.trim()) {
          this.erros.motivacao = 'Por favor, conte sua motivação';
        }
      }
      
      if (etapa === 3) {
        if (!this.formulario.aceita_termos) {
          this.erros.aceita_termos = 'Você precisa aceitar os termos';
        }
      }
      
      return Object.keys(this.erros).length === 0;
    },
    
    validarEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    validarTelefone(telefone) {
      const numeros = telefone.replace(/\D/g, '');
      return numeros.length >= 10 && numeros.length <= 11;
    },
    
    proximaEtapa() {
      if (this.validarEtapa(this.etapaAtual)) {
        this.etapaAtual++;
      }
    },
    
    etapaAnterior() {
      if (this.etapaAtual > 1) {
        this.etapaAtual--;
      }
    },
    
    getProgressoPercentual() {
      return ((this.etapaAtual - 1) / (this.totalEtapas - 1)) * 100;
    },
    
    formatarTelefone(event) {
      let valor = event.target.value.replace(/\D/g, '');
      if (valor.length <= 10) {
        valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
      this.formulario.telefone = valor;
    },
    
    // ========== ENVIO ==========
    async enviarInscricao() {
      if (!this.validarEtapa(3)) return;
      
      this.carregando = true;
      this.erro = null;
      
      try {
        const dados = {
          nome: this.formulario.nome.trim(),
          email: this.formulario.email.trim() || null,
          telefone: this.formulario.telefone.trim(),
          data_nascimento: this.formulario.data_nascimento || null,
          endereco: this.formulario.endereco.trim() || null,
          estado_civil: this.formulario.estado_civil || null,
          profissao: this.formulario.profissao.trim() || null,
          como_conheceu: this.formulario.como_conheceu.trim() || null,
          ja_batizado: this.formulario.ja_batizado,
          igreja_anterior: this.formulario.ja_batizado ? this.formulario.igreja_anterior.trim() : null,
          motivacao: this.formulario.motivacao.trim(),
          disponibilidade: this.formulario.disponibilidade.trim() || null,
          turma_id: this.formulario.turma_id || null,
          status: 'pendente'
        };
        
        // Verificar se usuário está logado
        const usuarioId = this.obterUsuarioId();
        if (usuarioId) {
          dados.usuario_id = usuarioId;
        }
        
        if (window.supabaseClient && window.supabaseClient.client) {
          const { error } = await window.supabaseClient.client
            .from('catecumenos')
            .insert(dados);
          
          if (error) throw error;
          
          this.tela = 'sucesso';
        }
      } catch (error) {
        console.error('Erro ao enviar inscrição:', error);
        this.erro = 'Ocorreu um erro ao enviar sua inscrição. Por favor, tente novamente.';
      } finally {
        this.carregando = false;
      }
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
    
    reiniciar() {
      this.tela = 'turmas';
      this.turmaSelecionada = null;
      this.etapaAtual = 1;
      this.erro = null;
      this.erros = {};
      this.formulario = {
        nome: '',
        email: '',
        telefone: '',
        data_nascimento: '',
        endereco: '',
        estado_civil: '',
        profissao: '',
        como_conheceu: '',
        ja_batizado: false,
        igreja_anterior: '',
        motivacao: '',
        disponibilidade: '',
        turma_id: '',
        aceita_termos: false
      };
      this.carregarTurmas();
    }
  };
}

/**
 * Componente Alpine.js para admin de catecúmenos
 */
function adminCatecumenos() {
  return {
    catecumenos: [],
    turmas: [],
    carregando: true,
    filtroStatus: 'todos',
    filtroTurma: 'todas',
    busca: '',
    catecumenoSelecionado: null,
    modalAberto: false,
    
    async init() {
      await Promise.all([
        this.carregarCatecumenos(),
        this.carregarTurmas()
      ]);
    },
    
    async carregarCatecumenos() {
      this.carregando = true;
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .from('catecumenos')
            .select(`*, turma:turmas_catecumenos(nome)`)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          this.catecumenos = data || [];
        }
      } catch (error) {
        console.error('Erro ao carregar catecúmenos:', error);
      } finally {
        this.carregando = false;
      }
    },
    
    async carregarTurmas() {
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          const { data, error } = await window.supabaseClient.client
            .from('turmas_catecumenos')
            .select('*')
            .order('data_inicio', { ascending: false });
          
          if (error) throw error;
          this.turmas = data || [];
        }
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
      }
    },
    
    get catecumenosFiltrados() {
      return this.catecumenos.filter(c => {
        if (this.filtroStatus !== 'todos' && c.status !== this.filtroStatus) return false;
        if (this.filtroTurma !== 'todas') {
          if (this.filtroTurma === 'sem_turma' && c.turma_id) return false;
          if (this.filtroTurma !== 'sem_turma' && c.turma_id !== this.filtroTurma) return false;
        }
        if (this.busca.trim()) {
          const termo = this.busca.toLowerCase();
          return c.nome.toLowerCase().includes(termo) ||
                 (c.email && c.email.toLowerCase().includes(termo)) ||
                 c.telefone.includes(termo);
        }
        return true;
      });
    },
    
    async atualizarStatus(catecumeno, novoStatus) {
      try {
        const { error } = await window.supabaseClient.client
          .from('catecumenos')
          .update({ status: novoStatus })
          .eq('id', catecumeno.id);
        
        if (error) throw error;
        catecumeno.status = novoStatus;
        if (window.mostrarToast) window.mostrarToast('Status atualizado', 'sucesso');
      } catch (error) {
        console.error('Erro:', error);
        if (window.mostrarToast) window.mostrarToast('Erro ao atualizar', 'erro');
      }
    },
    
    async atribuirTurma(catecumeno, turmaId) {
      try {
        const { error } = await window.supabaseClient.client
          .from('catecumenos')
          .update({ turma_id: turmaId || null })
          .eq('id', catecumeno.id);
        
        if (error) throw error;
        await this.carregarCatecumenos();
        if (window.mostrarToast) window.mostrarToast('Turma atribuída', 'sucesso');
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    
    verDetalhes(catecumeno) {
      this.catecumenoSelecionado = catecumeno;
      this.modalAberto = true;
    },
    
    fecharModal() {
      this.modalAberto = false;
      this.catecumenoSelecionado = null;
    },
    
    async excluirCatecumeno(catecumeno) {
      if (!confirm('Tem certeza que deseja excluir esta inscrição?')) return;
      try {
        const { error } = await window.supabaseClient.client
          .from('catecumenos')
          .delete()
          .eq('id', catecumeno.id);
        
        if (error) throw error;
        this.catecumenos = this.catecumenos.filter(c => c.id !== catecumeno.id);
        this.fecharModal();
        if (window.mostrarToast) window.mostrarToast('Inscrição excluída', 'sucesso');
      } catch (error) {
        console.error('Erro:', error);
      }
    },
    
    formatarData(data) {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR');
    },
    
    getStatusBadge(status) {
      const badges = {
        'pendente': 'badge-warning',
        'aprovado': 'badge-info',
        'em_andamento': 'badge-primary',
        'concluido': 'badge-success',
        'desistente': 'badge-danger'
      };
      return badges[status] || 'badge-secondary';
    },
    
    getStatusTexto(status) {
      const textos = {
        'pendente': 'Pendente',
        'aprovado': 'Aprovado',
        'em_andamento': 'Em Andamento',
        'concluido': 'Concluído',
        'desistente': 'Desistente'
      };
      return textos[status] || status;
    },
    
    exportarCSV() {
      const dados = this.catecumenosFiltrados.map(c => ({
        Nome: c.nome,
        Email: c.email || '',
        Telefone: c.telefone,
        Status: this.getStatusTexto(c.status),
        Turma: c.turma?.nome || 'Sem turma',
        'Data Inscrição': this.formatarData(c.created_at)
      }));
      
      const headers = Object.keys(dados[0] || {});
      let csv = headers.join(',') + '\n';
      dados.forEach(row => {
        csv += headers.map(h => `"${row[h]}"`).join(',') + '\n';
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `catecumenos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };
}

/**
 * Componente Alpine.js para admin de turmas
 */
function adminTurmasCatecumenos() {
  return {
    turmas: [],
    carregando: true,
    modalAberto: false,
    turmaEditando: null,
    
    formulario: {
      nome: '',
      descricao: '',
      data_inicio: '',
      data_fim: '',
      dia_semana: '',
      horario: '',
      local: '',
      vagas: 20,
      instrutor: '',
      status: 'aberta',
      requer_aprovacao: true,
      ativo: true,
      link_google_meet: '',
      link_whatsapp: '',
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
    },
    
    async init() {
      await this.carregarTurmas();
    },
    
    async carregarTurmas() {
      this.carregando = true;
      try {
        if (window.supabaseClient && window.supabaseClient.client) {
          // Buscar turmas com contagem de inscritos
          const { data, error } = await window.supabaseClient.client
            .from('turmas_catecumenos')
            .select('*')
            .order('data_inicio', { ascending: false });
          
          if (error) throw error;
          
          // Buscar contagem de inscritos
          const { data: inscritosData } = await window.supabaseClient.client
            .from('catecumenos')
            .select('turma_id')
            .not('turma_id', 'is', null);
          
          const contagem = {};
          if (inscritosData) {
            inscritosData.forEach(i => {
              contagem[i.turma_id] = (contagem[i.turma_id] || 0) + 1;
            });
          }
          
          this.turmas = (data || []).map(t => ({
            ...t,
            vagas_ocupadas: contagem[t.id] || 0
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar turmas:', error);
      } finally {
        this.carregando = false;
      }
    },
    
    abrirModal() {
      this.turmaEditando = null;
      this.formulario = {
        nome: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        dia_semana: '',
        horario: '',
        local: '',
        vagas: 20,
        instrutor: '',
        status: 'aberta',
        requer_aprovacao: true,
        ativo: true,
        link_google_meet: '',
        link_whatsapp: '',
        nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
      };
      this.modalAberto = true;
    },
    
    editar(turma) {
      this.turmaEditando = turma;
      this.formulario = {
        nome: turma.nome || '',
        descricao: turma.descricao || '',
        data_inicio: turma.data_inicio || '',
        data_fim: turma.data_fim || '',
        dia_semana: turma.dia_semana || '',
        horario: turma.horario || '',
        local: turma.local || '',
        vagas: turma.vagas || 20,
        instrutor: turma.instrutor || '',
        status: turma.status || 'aberta',
        requer_aprovacao: turma.requer_aprovacao !== false,
        ativo: turma.ativo !== false,
        link_google_meet: turma.link_google_meet || '',
        link_whatsapp: turma.link_whatsapp || '',
        nivel_acesso: turma.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao']
      };
      this.modalAberto = true;
    },
    
    fecharModal() {
      this.modalAberto = false;
      this.turmaEditando = null;
    },
    
    async salvar() {
      if (!this.formulario.nome || !this.formulario.data_inicio) {
        alert('Nome e data de início são obrigatórios');
        return;
      }
      
      this.carregando = true;
      try {
        const dados = { ...this.formulario };
        const ehNovo = !this.turmaEditando;
        let resultado;
        
        if (this.turmaEditando) {
          const { data, error } = await window.supabaseClient.client
            .from('turmas_catecumenos')
            .update(dados)
            .eq('id', this.turmaEditando.id)
            .select()
            .single();
          
          if (error) throw error;
          resultado = data;
        } else {
          const { data, error } = await window.supabaseClient.client
            .from('turmas_catecumenos')
            .insert(dados)
            .select()
            .single();
          
          if (error) throw error;
          resultado = data;
        }
        
        // Criar notificação automática para novas turmas
        if (ehNovo && window.NotificacoesAutomaticas) {
          await window.NotificacoesAutomaticas.novaTurmaCatecumenos({
            id: resultado?.id,
            nome: dados.nome,
            vagas: dados.vagas,
            nivel_acesso: dados.nivel_acesso
          });
        }
        
        await this.carregarTurmas();
        this.fecharModal();
        if (window.mostrarToast) window.mostrarToast('Turma salva', 'sucesso');
      } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar turma: ' + error.message);
      } finally {
        this.carregando = false;
      }
    },
    
    async excluir(turma) {
      if (!confirm(`Excluir a turma "${turma.nome}"? Esta ação não pode ser desfeita.`)) return;
      
      try {
        const { error } = await window.supabaseClient.client
          .from('turmas_catecumenos')
          .delete()
          .eq('id', turma.id);
        
        if (error) throw error;
        this.turmas = this.turmas.filter(t => t.id !== turma.id);
        if (window.mostrarToast) window.mostrarToast('Turma excluída', 'sucesso');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir turma. Pode haver inscrições vinculadas.');
      }
    },
    
    formatarData(data) {
      if (!data) return '-';
      return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
    },
    
    getStatusBadge(status) {
      const badges = {
        'aberta': 'badge-success',
        'em_andamento': 'badge-primary',
        'encerrada': 'badge-secondary',
        'cancelada': 'badge-danger'
      };
      return badges[status] || 'badge-secondary';
    },
    
    getStatusTexto(status) {
      const textos = {
        'aberta': 'Aberta',
        'em_andamento': 'Em Andamento',
        'encerrada': 'Encerrada',
        'cancelada': 'Cancelada'
      };
      return textos[status] || status;
    }
  };
}

// Registrar componentes globalmente
window.inscricaoCatecumeno = inscricaoCatecumeno;
window.adminCatecumenos = adminCatecumenos;
window.adminTurmasCatecumenos = adminTurmasCatecumenos;
