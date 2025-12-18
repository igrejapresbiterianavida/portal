// ============================================
// EMAIL-NOTIFICACOES.JS - Sistema de Envio de Emails
// ============================================

/**
 * Sistema de envio de notificações por email
 * Usa EmailJS para envio direto do frontend
 * ou Supabase Edge Functions para envio do backend
 */
class EmailNotificacoes {
  constructor() {
    // Configurações do EmailJS (inicializar no HTML)
    this.emailJsUserId = null;
    this.emailJsServiceId = null;
    this.emailJsTemplateId = null;
    
    // Status
    this.inicializado = false;
  }

  /**
   * Inicializa o serviço de email
   * @param {Object} config - Configurações do EmailJS
   */
  init(config = {}) {
    if (window.emailjs) {
      this.emailJsUserId = config.userId || 'YOUR_USER_ID';
      this.emailJsServiceId = config.serviceId || 'YOUR_SERVICE_ID';
      this.emailJsTemplateId = config.templateId || 'YOUR_TEMPLATE_ID';
      
      // Inicializar EmailJS
      emailjs.init(this.emailJsUserId);
      this.inicializado = true;
      console.log('✅ Sistema de Email inicializado');
    } else {
      console.warn('⚠️ EmailJS não carregado. Emails serão logados no console.');
    }
  }

  /**
   * Envia uma notificação por email
   * @param {Object} notificacao - Dados da notificação
   * @param {string} destinatarioEmail - Email do destinatário
   * @param {string} destinatarioNome - Nome do destinatário
   * @returns {Promise<boolean>}
   */
  async enviarNotificacao(notificacao, destinatarioEmail, destinatarioNome) {
    const params = {
      to_email: destinatarioEmail,
      to_name: destinatarioNome || 'Irmão(ã)',
      from_name: 'Igreja Presbiteriana Vida',
      subject: notificacao.titulo,
      message: notificacao.mensagem,
      notification_type: this.obterTipoFormatado(notificacao.tipo),
      link: notificacao.link || '',
      link_text: notificacao.link_texto || 'Acessar',
      date: new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    return this.enviar(params, notificacao.id);
  }

  /**
   * Envia um email de boas-vindas
   * @param {string} email
   * @param {string} nome
   * @returns {Promise<boolean>}
   */
  async enviarBoasVindas(email, nome) {
    const params = {
      to_email: email,
      to_name: nome,
      from_name: 'Igreja Presbiteriana Vida',
      subject: 'Bem-vindo(a) ao Portal IPV!',
      message: `Olá ${nome}! É uma alegria ter você conosco. Agora você faz parte da nossa comunidade online e pode acompanhar todas as novidades, cultos e programações da nossa igreja.`,
      notification_type: 'Boas-vindas',
      link: window.location.origin,
      link_text: 'Acessar Portal'
    };

    return this.enviar(params, null, 'boasvindas');
  }

  /**
   * Envia um email de confirmação de inscrição (catecúmenos)
   * @param {Object} inscricao - Dados da inscrição
   * @param {Object} turma - Dados da turma
   * @returns {Promise<boolean>}
   */
  async enviarConfirmacaoInscricao(inscricao, turma) {
    const params = {
      to_email: inscricao.email,
      to_name: inscricao.nome,
      from_name: 'Igreja Presbiteriana Vida',
      subject: `Inscrição Confirmada - ${turma.nome}`,
      message: `Sua inscrição na turma "${turma.nome}" foi recebida com sucesso!\n\n` +
               `📅 Início: ${this.formatarData(turma.data_inicio)}\n` +
               `🕐 Horário: ${turma.horario || 'A definir'}\n` +
               `📍 Local: ${turma.local || 'Igreja'}\n\n` +
               `Em breve entraremos em contato para confirmar sua participação.`,
      notification_type: 'Inscrição em Catecúmenos',
      link: turma.link_whatsapp || '',
      link_text: 'Entrar no Grupo WhatsApp'
    };

    return this.enviar(params, null, 'confirmacao');
  }

  /**
   * Envia um lembrete de evento/programação
   * @param {Object} evento - Dados do evento
   * @param {string} email
   * @param {string} nome
   * @returns {Promise<boolean>}
   */
  async enviarLembreteEvento(evento, email, nome) {
    const params = {
      to_email: email,
      to_name: nome,
      from_name: 'Igreja Presbiteriana Vida',
      subject: `Lembrete: ${evento.titulo}`,
      message: `Olá ${nome}! Este é um lembrete sobre o evento:\n\n` +
               `📌 ${evento.titulo}\n` +
               `📅 Data: ${this.formatarData(evento.data_evento)}\n` +
               `🕐 Horário: ${evento.horario || 'A definir'}\n` +
               `📍 Local: ${evento.local || 'Igreja'}\n\n` +
               `Esperamos você!`,
      notification_type: 'Lembrete de Evento',
      link: '',
      link_text: ''
    };

    return this.enviar(params, null, 'notificacao');
  }

  /**
   * Método interno para enviar email
   * @param {Object} params
   * @param {string} notificacaoId
   * @param {string} tipo
   * @returns {Promise<boolean>}
   */
  async enviar(params, notificacaoId = null, tipo = 'notificacao') {
    try {
      // Se EmailJS estiver disponível, usar
      if (this.inicializado && window.emailjs) {
        const response = await emailjs.send(
          this.emailJsServiceId,
          this.emailJsTemplateId,
          params
        );
        
        console.log('✅ Email enviado:', response);
        
        // Logar no banco de dados
        await this.logarEnvio(params.to_email, params.subject, params.message, tipo, 'enviado', notificacaoId);
        
        return true;
      } else {
        // Fallback: apenas logar
        console.log('📧 Email (simulado):', params);
        
        // Logar no banco como pendente
        await this.logarEnvio(params.to_email, params.subject, params.message, tipo, 'pendente', notificacaoId);
        
        return true;
      }
    } catch (erro) {
      console.error('❌ Erro ao enviar email:', erro);
      
      // Logar erro no banco
      await this.logarEnvio(params.to_email, params.subject, params.message, tipo, 'erro', notificacaoId, erro.message);
      
      return false;
    }
  }

  /**
   * Loga o envio de email no banco de dados
   */
  async logarEnvio(destinatario, assunto, corpo, tipo, status, notificacaoId = null, erroMsg = null) {
    if (!window.supabaseClient || !window.supabaseClient.client) return;

    try {
      await window.supabaseClient.criar('emails_log', {
        destinatario,
        assunto,
        corpo,
        tipo,
        status,
        notificacao_id: notificacaoId,
        erro_mensagem: erroMsg
      });
    } catch (erro) {
      console.warn('Não foi possível logar email:', erro);
    }
  }

  /**
   * Formata o tipo de notificação
   * @param {string} tipo
   * @returns {string}
   */
  obterTipoFormatado(tipo) {
    const tipos = {
      'info': 'Informação',
      'alerta': 'Alerta',
      'sucesso': 'Sucesso',
      'erro': 'Erro',
      'novo_video': 'Novo Vídeo',
      'nova_programacao': 'Nova Programação',
      'novo_evento': 'Novo Evento',
      'aviso': 'Aviso Importante'
    };
    return tipos[tipo] || 'Notificação';
  }

  /**
   * Formata uma data
   * @param {string} data
   * @returns {string}
   */
  formatarData(data) {
    if (!data) return 'A definir';
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Envia notificação para todos os usuários com acesso
   * @param {Object} notificacao
   * @returns {Promise<number>} - Número de emails enviados
   */
  async enviarParaTodos(notificacao) {
    if (!window.supabaseClient || !window.supabaseClient.client) {
      console.warn('Supabase não disponível');
      return 0;
    }

    try {
      // Buscar usuários com acesso
      const usuarios = await window.supabaseClient.listar('usuarios', {
        igual: { ativo: true }
      });

      if (!usuarios || usuarios.length === 0) {
        console.log('Nenhum usuário para notificar');
        return 0;
      }

      // Filtrar por nível de acesso
      const niveis = notificacao.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao'];
      const usuariosFiltrados = usuarios.filter(u => {
        if (niveis.includes('visitante')) return true;
        return niveis.includes(u.tipo);
      });

      // Filtrar apenas quem tem email
      const comEmail = usuariosFiltrados.filter(u => u.email);

      let enviados = 0;
      for (const usuario of comEmail) {
        const sucesso = await this.enviarNotificacao(
          notificacao,
          usuario.email,
          usuario.nome
        );
        if (sucesso) enviados++;
        
        // Pequeno delay para não sobrecarregar
        await new Promise(r => setTimeout(r, 100));
      }

      console.log(`✅ ${enviados}/${comEmail.length} emails enviados`);
      return enviados;
    } catch (erro) {
      console.error('Erro ao enviar para todos:', erro);
      return 0;
    }
  }
}

// Instância global
const emailNotificacoes = new EmailNotificacoes();

// Exportar para uso global
window.emailNotificacoes = emailNotificacoes;

console.log('✅ Sistema de Email carregado');

