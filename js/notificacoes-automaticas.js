// ============================================
// NOTIFICACOES-AUTOMATICAS.JS - Sistema de Notificações Automáticas
// ============================================

/**
 * Sistema centralizado de notificações automáticas
 * Cria notificações quando novos itens são salvos no banco de dados
 */
const NotificacoesAutomaticas = {
  
  /**
   * Cria uma notificação no banco de dados
   * @param {Object} dados - Dados da notificação
   * @returns {Promise<Object>} - Notificação criada
   */
  async criarNotificacao(dados) {
    if (!window.supabaseClient || !window.supabaseClient.client) {
      console.error('❌ Supabase não disponível');
      return null;
    }
    
    try {
      const notificacao = {
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        tipo: dados.tipo || 'sistema',
        nivel_acesso: dados.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao'],
        dados_extras: dados.dados_extras || {},
        ativo: true,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await window.supabaseClient.client
        .from('notificacoes')
        .insert([notificacao])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar notificação:', error);
        return null;
      }
      
      console.log('✅ Notificação criada:', data);
      
      // Tentar enviar emails para membros
      await this.enviarEmailMembros(dados);
      
      // Tentar enviar push notification
      await this.enviarPushNotification(dados);
      
      return data;
      
    } catch (erro) {
      console.error('❌ Erro ao criar notificação:', erro);
      return null;
    }
  },
  
  /**
   * Notifica sobre novo vídeo
   * @param {Object} video - Dados do vídeo
   */
  async novoVideo(video) {
    await this.criarNotificacao({
      titulo: '🎬 Novo Vídeo Disponível!',
      mensagem: `"${video.titulo}" foi publicado. Assista agora no nosso canal!`,
      tipo: 'video',
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao'],
      dados_extras: {
        url: video.url || `https://youtube.com/watch?v=${video.video_id}`,
        video_id: video.id,
        thumbnail: video.thumbnail
      }
    });
  },
  
  /**
   * Notifica sobre nova programação/evento
   * @param {Object} evento - Dados do evento
   */
  async novaProgramacao(evento) {
    const dataFormatada = evento.dia ? `${evento.dia} ${evento.mes || ''}` : 'Em breve';
    
    await this.criarNotificacao({
      titulo: '📅 Nova Programação!',
      mensagem: `${evento.titulo} - ${dataFormatada} às ${evento.horario || 'horário a definir'}`,
      tipo: 'programacao',
      nivel_acesso: evento.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao'],
      dados_extras: {
        url: '../index.html#programacao',
        evento_id: evento.id,
        data: evento.data_evento,
        local: evento.local
      }
    });
  },
  
  /**
   * Notifica sobre novo devocional
   * @param {Object} devocional - Dados do devocional
   */
  async novoDevocional(devocional) {
    await this.criarNotificacao({
      titulo: '📖 Novo Devocional!',
      mensagem: `"${devocional.titulo}" - ${devocional.autor || 'Leia agora'}`,
      tipo: 'devocional',
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao'],
      dados_extras: {
        url: '../index.html#devocionais',
        devocional_id: devocional.id
      }
    });
  },
  
  /**
   * Notifica sobre nova turma de catecúmenos
   * @param {Object} turma - Dados da turma
   */
  async novaTurmaCatecumenos(turma) {
    await this.criarNotificacao({
      titulo: '📚 Nova Turma de Catecúmenos!',
      mensagem: `${turma.nome} - Inscrições abertas! ${turma.vagas ? `${turma.vagas} vagas disponíveis.` : ''}`,
      tipo: 'catecumeno',
      nivel_acesso: turma.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao'],
      dados_extras: {
        url: '../index.html#catecumenos',
        turma_id: turma.id
      }
    });
  },
  
  /**
   * Notifica sobre novo aviso
   * @param {Object} aviso - Dados do aviso
   */
  async novoAviso(aviso) {
    await this.criarNotificacao({
      titulo: '📢 ' + aviso.titulo,
      mensagem: aviso.conteudo?.substring(0, 150) || 'Confira o novo aviso da igreja!',
      tipo: 'aviso',
      nivel_acesso: aviso.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao'],
      dados_extras: {
        url: '../index.html',
        aviso_id: aviso.id
      }
    });
  },
  
  /**
   * Envia email para membros cadastrados
   * @param {Object} dados - Dados da notificação
   */
  async enviarEmailMembros(dados) {
    if (!window.emailNotificacoes) {
      console.log('📧 Sistema de email não disponível');
      return;
    }
    
    try {
      // Buscar emails dos membros ativos
      const { data: usuarios, error } = await window.supabaseClient.client
        .from('usuarios')
        .select('email, nome')
        .eq('ativo', true)
        .in('tipo', ['membro', 'lideranca', 'administracao'])
        .not('email', 'is', null);
      
      if (error || !usuarios || usuarios.length === 0) {
        console.log('📧 Nenhum membro para enviar email');
        return;
      }
      
      console.log(`📧 Enviando emails para ${usuarios.length} membros...`);
      
      // Enviar emails (limitado para não sobrecarregar)
      const limite = Math.min(usuarios.length, 50);
      for (let i = 0; i < limite; i++) {
        const usuario = usuarios[i];
        await window.emailNotificacoes.enviarNotificacao({
          para_email: usuario.email,
          para_nome: usuario.nome,
          assunto: dados.titulo,
          mensagem: dados.mensagem,
          tipo: dados.tipo,
          url: dados.dados_extras?.url
        });
        
        // Pequeno delay entre envios
        await new Promise(r => setTimeout(r, 100));
      }
      
      console.log('✅ Emails enviados com sucesso');
      
    } catch (erro) {
      console.error('❌ Erro ao enviar emails:', erro);
    }
  },
  
  /**
   * Envia push notification para PWA
   * @param {Object} dados - Dados da notificação
   */
  async enviarPushNotification(dados) {
    // Verificar se o navegador suporta notificações
    if (!('Notification' in window)) {
      console.log('🔔 Navegador não suporta notificações');
      return;
    }
    
    // Verificar permissão
    if (Notification.permission !== 'granted') {
      console.log('🔔 Permissão de notificação não concedida');
      return;
    }
    
    try {
      // Verificar se temos service worker registrado
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Enviar via service worker para funcionar em background
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title: dados.titulo,
            body: dados.mensagem,
            icon: '../assets/icons/ipvida.png',
            badge: '../assets/icons/ipvida.png',
            tag: dados.tipo + '-' + Date.now(),
            data: {
              url: dados.dados_extras?.url || '../index.html'
            }
          }
        });
        
        console.log('✅ Push notification enviada via Service Worker');
      } else {
        // Fallback: mostrar notificação diretamente
        new Notification(dados.titulo, {
          body: dados.mensagem,
          icon: '../assets/icons/ipvida.png',
          tag: dados.tipo + '-' + Date.now()
        });
        
        console.log('✅ Notificação mostrada diretamente');
      }
      
    } catch (erro) {
      console.error('❌ Erro ao enviar push notification:', erro);
    }
  },
  
  /**
   * Solicita permissão para notificações push
   */
  async solicitarPermissaoPush() {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
};

// Exportar globalmente
window.NotificacoesAutomaticas = NotificacoesAutomaticas;

console.log('✅ Sistema de Notificações Automáticas carregado');

