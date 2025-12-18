// ============================================
// NOTIFICACOES.JS - Sistema de Notificações IPVida
// ============================================

/**
 * Componente Alpine.js para o sistema de notificações
 */
function sistemaNotificacoes() {
  return {
    notificacoes: [],
    naoLidas: 0,
    dropdownAberto: false,
    carregando: false,
    
    async init() {
      await this.carregarNotificacoes();
      
      // Atualizar a cada 2 minutos
      setInterval(() => this.carregarNotificacoes(), 120000);
      
      // Verificar permissão de push
      this.verificarPermissaoPush();
    },
    
    async carregarNotificacoes() {
      try {
        // Verificar se usuário está logado
        const tipoUsuario = this.obterTipoUsuario();
        
        if (window.supabaseClient && window.supabaseClient.client) {
          const notificacoes = await window.supabaseClient.listar('notificacoes', {
            filtro: { campo: 'ativo', operador: 'eq', valor: true },
            ordem: { campo: 'created_at', ascendente: false },
            limite: 20
          });
          
          // Filtrar por nível de acesso
          this.notificacoes = (notificacoes || []).filter(n => 
            this.verificarAcesso(n.nivel_acesso, tipoUsuario)
          );
          
          // Buscar status de leitura se logado
          if (window.auth && auth.verificarSessaoAtiva()) {
            await this.marcarLidas();
          }
          
          this.atualizarContador();
        }
      } catch (erro) {
        console.error('Erro ao carregar notificações:', erro);
      }
    },
    
    async marcarLidas() {
      if (!window.supabaseClient || !window.auth || !auth.usuario) return;
      
      try {
        const leituras = await window.supabaseClient.listar('notificacoes_usuarios', {
          filtro: { campo: 'usuario_id', operador: 'eq', valor: auth.usuario.id }
        });
        
        const idsLidas = new Set(leituras.filter(l => l.lida).map(l => l.notificacao_id));
        
        this.notificacoes = this.notificacoes.map(n => ({
          ...n,
          lida: idsLidas.has(n.id)
        }));
      } catch (erro) {
        console.error('Erro ao marcar lidas:', erro);
      }
    },
    
    atualizarContador() {
      this.naoLidas = this.notificacoes.filter(n => !n.lida).length;
    },
    
    toggleDropdown() {
      this.dropdownAberto = !this.dropdownAberto;
    },
    
    fecharDropdown() {
      this.dropdownAberto = false;
    },
    
    async marcarComoLida(notificacao) {
      if (!window.supabaseClient || !window.auth || !auth.usuario) return;
      
      try {
        // Verificar se já existe registro
        const existente = await window.supabaseClient.listar('notificacoes_usuarios', {
          filtro: { campo: 'notificacao_id', operador: 'eq', valor: notificacao.id }
        });
        
        const registro = existente.find(e => e.usuario_id === auth.usuario.id);
        
        if (registro) {
          await window.supabaseClient.atualizar('notificacoes_usuarios', registro.id, {
            lida: true,
            data_leitura: new Date().toISOString()
          });
        } else {
          await window.supabaseClient.criar('notificacoes_usuarios', {
            notificacao_id: notificacao.id,
            usuario_id: auth.usuario.id,
            lida: true,
            data_leitura: new Date().toISOString()
          });
        }
        
        notificacao.lida = true;
        this.atualizarContador();
        
        // Se tiver link, navegar
        if (notificacao.link) {
          window.location.href = notificacao.link;
        }
      } catch (erro) {
        console.error('Erro ao marcar como lida:', erro);
      }
    },
    
    async marcarTodasLidas() {
      if (!window.supabaseClient || !window.auth || !auth.usuario) {
        // Se não logado, apenas marcar localmente
        this.notificacoes.forEach(n => n.lida = true);
        this.atualizarContador();
        return;
      }
      
      try {
        for (const notificacao of this.notificacoes.filter(n => !n.lida)) {
          await this.marcarComoLida(notificacao);
        }
      } catch (erro) {
        console.error('Erro ao marcar todas como lidas:', erro);
      }
    },
    
    obterTipoUsuario() {
      if (window.auth && auth.verificarSessaoAtiva() && auth.usuario) {
        return auth.usuario.tipo;
      }
      return null;
    },
    
    verificarAcesso(nivelAcesso, tipoUsuario) {
      if (nivelAcesso === 'publico') return true;
      if (!tipoUsuario) return false;
      if (tipoUsuario === 'administracao') return true;
      if (tipoUsuario === 'lideranca') return ['publico', 'membro', 'lideranca'].includes(nivelAcesso);
      if (tipoUsuario === 'membro') return ['publico', 'membro'].includes(nivelAcesso);
      return nivelAcesso === 'publico';
    },
    
    formatarTempo(data) {
      const agora = new Date();
      const dataNotificacao = new Date(data);
      const diff = agora - dataNotificacao;
      
      const minutos = Math.floor(diff / 60000);
      const horas = Math.floor(diff / 3600000);
      const dias = Math.floor(diff / 86400000);
      
      if (minutos < 1) return 'Agora';
      if (minutos < 60) return `${minutos}min atrás`;
      if (horas < 24) return `${horas}h atrás`;
      if (dias < 7) return `${dias}d atrás`;
      
      return dataNotificacao.toLocaleDateString('pt-BR');
    },
    
    obterIcone(tipo) {
      const icones = {
        info: 'info',
        alerta: 'warning',
        sucesso: 'check_circle',
        erro: 'error',
        novo_video: 'play_circle',
        nova_programacao: 'event',
        novo_evento: 'celebration',
        aviso: 'campaign'
      };
      return icones[tipo] || 'notifications';
    },
    
    // Push Notifications
    async verificarPermissaoPush() {
      if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações push');
        return;
      }
      
      if (Notification.permission === 'granted') {
        console.log('Permissão de notificações já concedida');
      }
    },
    
    async solicitarPermissaoPush() {
      if (!('Notification' in window)) {
        alert('Seu navegador não suporta notificações push');
        return false;
      }
      
      const permissao = await Notification.requestPermission();
      
      if (permissao === 'granted') {
        console.log('Permissão de notificações concedida');
        await this.registrarPushSubscription();
        return true;
      }
      
      return false;
    },
    
    async registrarPushSubscription() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push não suportado');
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Você precisaria de uma chave VAPID para isso funcionar em produção
        // const subscription = await registration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
        // });
        
        console.log('Push subscription registrada');
      } catch (erro) {
        console.error('Erro ao registrar push:', erro);
      }
    }
  };
}

/**
 * Componente Alpine.js para avisos pop-up
 */
function avisosPopup() {
  return {
    avisos: [],
    avisoAtual: null,
    
    async init() {
      await this.carregarAvisos();
    },
    
    async carregarAvisos() {
      try {
        const tipoUsuario = this.obterTipoUsuario();
        const sessaoId = this.obterSessaoId();
        
        if (window.supabaseClient && window.supabaseClient.client) {
          const avisos = await window.supabaseClient.listar('avisos_popup', {
            filtro: { campo: 'ativo', operador: 'eq', valor: true },
            ordem: { campo: 'prioridade', ascendente: false }
          });
          
          // Filtrar por nível de acesso e datas
          const agora = new Date();
          this.avisos = (avisos || []).filter(a => {
            // Verificar nível de acesso
            if (!this.verificarAcesso(a.nivel_acesso, tipoUsuario)) return false;
            
            // Verificar data de início
            if (a.data_inicio && new Date(a.data_inicio) > agora) return false;
            
            // Verificar data de fim
            if (a.data_fim && new Date(a.data_fim) < agora) return false;
            
            // Verificar se já foi visualizado (localStorage)
            if (a.mostrar_uma_vez) {
              const lidos = JSON.parse(localStorage.getItem('ipv_avisos_lidos') || '[]');
              if (lidos.includes(a.id)) return false;
            }
            
            // Verificar se foi fechado nesta sessão
            const fechados = JSON.parse(sessionStorage.getItem('ipv_avisos_fechados') || '[]');
            if (fechados.includes(a.id)) return false;
            
            return true;
          });
          
          // Mostrar primeiro aviso
          if (this.avisos.length > 0) {
            setTimeout(() => {
              this.mostrarProximoAviso();
            }, 1000);
          }
        }
      } catch (erro) {
        console.error('Erro ao carregar avisos:', erro);
      }
    },
    
    mostrarProximoAviso() {
      if (this.avisos.length > 0 && !this.avisoAtual) {
        this.avisoAtual = this.avisos[0];
        document.body.style.overflow = 'hidden';
      }
    },
    
    fecharAviso(marcarComoLido = false) {
      if (!this.avisoAtual) return;
      
      if (marcarComoLido) {
        // Salvar como lido permanentemente
        const lidos = JSON.parse(localStorage.getItem('ipv_avisos_lidos') || '[]');
        if (!lidos.includes(this.avisoAtual.id)) {
          lidos.push(this.avisoAtual.id);
          localStorage.setItem('ipv_avisos_lidos', JSON.stringify(lidos));
        }
        
        // Salvar no banco se logado
        this.salvarLeituraAviso(this.avisoAtual.id, 'lido');
      } else {
        // Salvar como fechado apenas na sessão
        const fechados = JSON.parse(sessionStorage.getItem('ipv_avisos_fechados') || '[]');
        if (!fechados.includes(this.avisoAtual.id)) {
          fechados.push(this.avisoAtual.id);
          sessionStorage.setItem('ipv_avisos_fechados', JSON.stringify(fechados));
        }
        
        // Salvar no banco se logado
        this.salvarLeituraAviso(this.avisoAtual.id, 'fechado');
      }
      
      // Remover do array
      this.avisos = this.avisos.filter(a => a.id !== this.avisoAtual.id);
      this.avisoAtual = null;
      document.body.style.overflow = '';
      
      // Mostrar próximo aviso após delay
      setTimeout(() => {
        this.mostrarProximoAviso();
      }, 500);
    },
    
    async salvarLeituraAviso(avisoId, status) {
      if (!window.supabaseClient || !window.auth) return;
      
      try {
        const dados = {
          aviso_id: avisoId,
          status: status,
          sessao_id: this.obterSessaoId()
        };
        
        if (auth.verificarSessaoAtiva() && auth.usuario) {
          dados.usuario_id = auth.usuario.id;
        }
        
        await window.supabaseClient.criar('avisos_usuarios', dados);
      } catch (erro) {
        // Ignorar erro de duplicidade
        console.log('Aviso já registrado');
      }
    },
    
    obterTipoUsuario() {
      if (window.auth && auth.verificarSessaoAtiva() && auth.usuario) {
        return auth.usuario.tipo;
      }
      return null;
    },
    
    verificarAcesso(nivelAcesso, tipoUsuario) {
      if (nivelAcesso === 'publico') return true;
      if (!tipoUsuario) return false;
      if (tipoUsuario === 'administracao') return true;
      if (tipoUsuario === 'lideranca') return ['publico', 'membro', 'lideranca'].includes(nivelAcesso);
      if (tipoUsuario === 'membro') return ['publico', 'membro'].includes(nivelAcesso);
      return nivelAcesso === 'publico';
    },
    
    obterSessaoId() {
      let sessaoId = sessionStorage.getItem('ipv_sessao_id');
      if (!sessaoId) {
        sessaoId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('ipv_sessao_id', sessaoId);
      }
      return sessaoId;
    }
  };
}

// Exportar para uso global
window.sistemaNotificacoes = sistemaNotificacoes;
window.avisosPopup = avisosPopup;

