// ============================================
// ADMIN-CRUD.JS - Componentes CRUD para Admin
// ============================================

// Importar CRUD de usuários se existir
// <script src="js/admin-crud-usuarios.js"></script>

// ==================== CRUD DEVOCIONAIS ====================
function crudDevocionais() {
  return {
    devocionais: [],
    devocionalEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      titulo: '',
      texto: '',
      imagem_url: '',
      ativo: true,
      data_publicacao: new Date().toISOString().split('T')[0],
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
    },
    arquivoImagem: null,
    previewImagem: null,

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.devocionais = await window.supabaseClient.listar('devocionais', {
          ordem: { campo: 'data_publicacao', ascendente: false }
        });
      } catch (erro) {
        console.error('Erro ao carregar devocionais:', erro);
        alert('Erro ao carregar devocionais');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(devocional = null) {
      this.devocionalEditando = devocional;
      if (devocional) {
        this.formulario = {
          titulo: devocional.titulo || '',
          texto: devocional.texto || '',
          imagem_url: devocional.imagem_url || '',
          ativo: devocional.ativo !== false,
          data_publicacao: devocional.data_publicacao || new Date().toISOString().split('T')[0],
          nivel_acesso: devocional.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao']
        };
        this.previewImagem = devocional.imagem_url;
      } else {
        this.formulario = {
          titulo: '',
          texto: '',
          imagem_url: '',
          ativo: true,
          data_publicacao: new Date().toISOString().split('T')[0],
          nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
        };
        this.previewImagem = null;
      }
      this.arquivoImagem = null;
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.devocionalEditando = null;
      this.formulario = {};
      this.arquivoImagem = null;
      this.previewImagem = null;
    },

    async selecionarImagem(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }

      this.arquivoImagem = arquivo;

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagem = e.target.result;
      };
      reader.readAsDataURL(arquivo);
    },

    async salvar() {
      if (!this.formulario.texto) {
        alert('O texto é obrigatório');
        return;
      }

      this.carregando = true;

      try {
        // Upload de imagem se houver
        if (this.arquivoImagem) {
          const url = await window.supabaseClient.uploadImagem(
            this.arquivoImagem,
            'devocionais',
            'devocionais/'
          );
          this.formulario.imagem_url = url;
        }

        // Salvar no banco
        const ehNovo = !this.devocionalEditando;
        let resultado;
        
        if (this.devocionalEditando) {
          resultado = await window.supabaseClient.atualizar('devocionais', this.devocionalEditando.id, this.formulario);
        } else {
          resultado = await window.supabaseClient.criar('devocionais', this.formulario);
        }

        // Criar notificação automática para novos devocionais
        if (ehNovo && window.NotificacoesAutomaticas) {
          await window.NotificacoesAutomaticas.novoDevocional({
            id: resultado?.id,
            titulo: this.formulario.titulo || 'Novo Devocional',
            autor: this.formulario.autor
          });
        }

        this.fecharModal();
        await this.carregar();
        alert('Devocional salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar devocional:', erro);
        alert('Erro ao salvar devocional: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este devocional?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('devocionais', id);
        await this.carregar();
        alert('Devocional deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar devocional');
      } finally {
        this.carregando = false;
      }
    }
  };
}

// ==================== CRUD VÍDEOS ====================
function crudVideos() {
  return {
    videos: [],
    videoEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      video_id: '',
      titulo: '',
      descricao: '',
      thumbnail_url: '',
      url: '',
      duracao: '',
      data_publicacao: '',
      destaque: false,
      ordem: 0,
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
    },

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.videos = await window.supabaseClient.listar('videos', {
          ordem: { campo: 'data_publicacao', ascendente: false }
        });
      } catch (erro) {
        console.error('Erro ao carregar vídeos:', erro);
        alert('Erro ao carregar vídeos');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(video = null) {
      this.videoEditando = video;
      if (video) {
        this.formulario = {
          video_id: video.video_id || '',
          titulo: video.titulo || '',
          descricao: video.descricao || '',
          thumbnail_url: video.thumbnail_url || '',
          url: video.url || '',
          duracao: video.duracao || '',
          data_publicacao: video.data_publicacao ? video.data_publicacao.split('T')[0] : '',
          destaque: video.destaque || false,
          ordem: video.ordem || 0,
          nivel_acesso: video.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao']
        };
      } else {
        this.formulario = {
          video_id: '',
          titulo: '',
          descricao: '',
          thumbnail_url: '',
          url: '',
          duracao: '',
          data_publicacao: '',
          destaque: false,
          ordem: 0,
          nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
        };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.videoEditando = null;
      this.formulario = {};
    },

    extrairIdDoYouTube(url) {
      // Extrai o ID do YouTube de diferentes formatos de URL
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(regex);
      return match ? match[1] : null;
    },

    async preencherDoYouTube() {
      if (!this.formulario.url) {
        alert('Digite a URL do YouTube primeiro');
        return;
      }

      const videoId = this.extrairIdDoYouTube(this.formulario.url);
      if (!videoId) {
        alert('URL do YouTube inválida');
        return;
      }

      this.formulario.video_id = videoId;
      this.formulario.thumbnail_url = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      
      // Dados são buscados automaticamente via RSS Feed do YouTube
      alert('ID e thumbnail preenchidos! Preencha os demais campos manualmente.');
    },

    async salvar() {
      if (!this.formulario.video_id || !this.formulario.titulo) {
        alert('ID do vídeo e título são obrigatórios');
        return;
      }

      this.carregando = true;

      try {
        const ehNovo = !this.videoEditando;
        let resultado;
        
        if (this.videoEditando) {
          resultado = await window.supabaseClient.atualizar('videos', this.videoEditando.id, this.formulario);
        } else {
          resultado = await window.supabaseClient.criar('videos', this.formulario);
        }

        // Criar notificação automática para novos vídeos
        if (ehNovo && window.NotificacoesAutomaticas) {
          await window.NotificacoesAutomaticas.novoVideo({
            id: resultado?.id,
            titulo: this.formulario.titulo,
            url: `https://youtube.com/watch?v=${this.formulario.video_id}`,
            video_id: this.formulario.video_id,
            thumbnail: this.formulario.thumbnail_url
          });
        }

        this.fecharModal();
        await this.carregar();
        alert('Vídeo salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar vídeo:', erro);
        alert('Erro ao salvar vídeo: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('videos', id);
        await this.carregar();
        alert('Vídeo deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar vídeo');
      } finally {
        this.carregando = false;
      }
    }
  };
}

// ==================== CRUD PROGRAMAÇÃO ====================
function crudProgramacao() {
  return {
    programas: [],
    programaEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      titulo: '',
      descricao: '',
      dia: new Date().getDate(),
      mes: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][new Date().getMonth()],
      ano: new Date().getFullYear(),
      horario: '',
      local: '',
      categoria: '',
      cor_categoria: '#1A4731',
      cor1: '#1A4731',
      cor2: '#2D5F4A',
      imagem_url: '',
      link: '',
      ordem: 0,
      ativo: true,
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
    },
    arquivoImagem: null,
    previewImagem: null,
    meses: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.programas = await window.supabaseClient.listar('programacao', {
          ordem: { campo: 'ordem', ascendente: true }
        });
      } catch (erro) {
        console.error('Erro ao carregar programação:', erro);
        alert('Erro ao carregar programação');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(programa = null) {
      this.programaEditando = programa;
      if (programa) {
        this.formulario = { 
          ...programa,
          // Garantir que nivel_acesso seja um array válido
          nivel_acesso: programa.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao']
        };
        this.previewImagem = programa.imagem_url;
      } else {
        this.formulario = {
          titulo: '',
          descricao: '',
          dia: new Date().getDate(),
          mes: this.meses[new Date().getMonth()],
          ano: new Date().getFullYear(),
          horario: '',
          local: '',
          categoria: '',
          cor_categoria: '#1A4731',
          cor1: '#1A4731',
          cor2: '#2D5F4A',
          imagem_url: '',
          link: '',
          ordem: 0,
          ativo: true,
          nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
        };
        this.previewImagem = null;
      }
      this.arquivoImagem = null;
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.programaEditando = null;
      this.formulario = {};
      this.arquivoImagem = null;
      this.previewImagem = null;
    },

    async selecionarImagem(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }

      this.arquivoImagem = arquivo;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagem = e.target.result;
      };
      reader.readAsDataURL(arquivo);
    },

    async salvar() {
      if (!this.formulario.titulo || !this.formulario.horario || !this.formulario.local) {
        alert('Título, horário e local são obrigatórios');
        return;
      }

      this.carregando = true;

      try {
        if (this.arquivoImagem) {
          const url = await window.supabaseClient.uploadImagem(
            this.arquivoImagem,
            'programacao',
            'programacao/'
          );
          this.formulario.imagem_url = url;
        }

        const ehNovo = !this.programaEditando;
        let resultado;
        
        if (this.programaEditando) {
          resultado = await window.supabaseClient.atualizar('programacao', this.programaEditando.id, this.formulario);
        } else {
          resultado = await window.supabaseClient.criar('programacao', this.formulario);
        }

        // Criar notificação automática para novos eventos
        if (ehNovo && window.NotificacoesAutomaticas) {
          await window.NotificacoesAutomaticas.novaProgramacao({
            id: resultado?.id,
            titulo: this.formulario.titulo,
            dia: this.formulario.dia,
            mes: this.formulario.mes,
            horario: this.formulario.horario,
            local: this.formulario.local,
            nivel_acesso: this.formulario.nivel_acesso
          });
        }

        this.fecharModal();
        await this.carregar();
        alert('Programa salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar programa:', erro);
        alert('Erro ao salvar programa: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este programa?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('programacao', id);
        await this.carregar();
        alert('Programa deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar programa');
      } finally {
        this.carregando = false;
      }
    }
  };
}

// ==================== CRUD VISITANTES ====================
function crudVisitantes() {
  return {
    visitantes: [],
    visitanteEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      nome: '',
      telefone: '',
      email: '',
      data_visita: '',
      mensagem: '',
      status: 'confirmado',
      observacoes: ''
    },

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.visitantes = await window.supabaseClient.listar('visitantes', {
          ordem: { campo: 'data_visita', ascendente: false }
        });
      } catch (erro) {
        console.error('Erro ao carregar visitantes:', erro);
        alert('Erro ao carregar visitantes');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(visitante = null) {
      this.visitanteEditando = visitante;
      if (visitante) {
        this.formulario = {
          nome: visitante.nome || '',
          telefone: visitante.telefone || '',
          email: visitante.email || '',
          data_visita: visitante.data_visita || '',
          mensagem: visitante.mensagem || '',
          status: visitante.status || 'confirmado',
          observacoes: visitante.observacoes || ''
        };
      } else {
        this.formulario = {
          nome: '',
          telefone: '',
          email: '',
          data_visita: '',
          mensagem: '',
          status: 'confirmado',
          observacoes: ''
        };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.visitanteEditando = null;
      this.formulario = {};
    },

    async salvar() {
      if (!this.formulario.nome || !this.formulario.data_visita) {
        alert('Nome e data da visita são obrigatórios');
        return;
      }

      this.carregando = true;

      try {
        if (this.visitanteEditando) {
          await window.supabaseClient.atualizar('visitantes', this.visitanteEditando.id, this.formulario);
        } else {
          await window.supabaseClient.criar('visitantes', this.formulario);
        }

        this.fecharModal();
        await this.carregar();
        alert('Visitante salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar visitante:', erro);
        alert('Erro ao salvar visitante: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este visitante?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('visitantes', id);
        await this.carregar();
        alert('Visitante deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar visitante');
      } finally {
        this.carregando = false;
      }
    },

    formatarData(dataString) {
      if (!dataString) return '';
      const data = new Date(dataString + 'T00:00:00');
      return data.toLocaleDateString('pt-BR');
    }
  };
}

// ==================== CRUD EVENTOS ====================
function crudEventos() {
  return {
    eventos: [],
    eventoEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      titulo: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      horario: '',
      local: '',
      imagem_url: '',
      inscricao_aberta: false,
      link_inscricao: '',
      ativo: true,
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
    },
    arquivoImagem: null,
    previewImagem: null,

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.eventos = await window.supabaseClient.listar('eventos', {
          ordem: { campo: 'data', ascendente: false }
        });
      } catch (erro) {
        console.error('Erro ao carregar eventos:', erro);
        alert('Erro ao carregar eventos');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(evento = null) {
      this.eventoEditando = evento;
      if (evento) {
        this.formulario = {
          titulo: evento.titulo || '',
          descricao: evento.descricao || '',
          data: evento.data ? evento.data.split('T')[0] : new Date().toISOString().split('T')[0],
          horario: evento.horario || '',
          local: evento.local || '',
          imagem_url: evento.imagem_url || '',
          inscricao_aberta: evento.inscricao_aberta || false,
          link_inscricao: evento.link_inscricao || '',
          ativo: evento.ativo !== false,
          nivel_acesso: evento.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao']
        };
        this.previewImagem = evento.imagem_url;
      } else {
        this.formulario = {
          titulo: '',
          descricao: '',
          data: new Date().toISOString().split('T')[0],
          horario: '',
          local: '',
          imagem_url: '',
          inscricao_aberta: false,
          link_inscricao: '',
          ativo: true,
          nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
        };
        this.previewImagem = null;
      }
      this.arquivoImagem = null;
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.eventoEditando = null;
      this.formulario = {};
      this.arquivoImagem = null;
      this.previewImagem = null;
    },

    async selecionarImagem(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }

      this.arquivoImagem = arquivo;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImagem = e.target.result;
      };
      reader.readAsDataURL(arquivo);
    },

    async salvar() {
      if (!this.formulario.titulo || !this.formulario.data) {
        alert('Título e data são obrigatórios');
        return;
      }

      this.carregando = true;

      try {
        if (this.arquivoImagem) {
          const url = await window.supabaseClient.uploadImagem(
            this.arquivoImagem,
            'imagens',
            'eventos/'
          );
          this.formulario.imagem_url = url;
        }

        if (this.eventoEditando) {
          await window.supabaseClient.atualizar('eventos', this.eventoEditando.id, this.formulario);
        } else {
          await window.supabaseClient.criar('eventos', this.formulario);
        }

        this.fecharModal();
        await this.carregar();
        alert('Evento salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar evento:', erro);
        alert('Erro ao salvar evento: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este evento?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('eventos', id);
        await this.carregar();
        alert('Evento deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar evento');
      } finally {
        this.carregando = false;
      }
    },

    formatarData(dataString) {
      if (!dataString) return '';
      const data = new Date(dataString + 'T00:00:00');
      return data.toLocaleDateString('pt-BR');
    }
  };
}

// ==================== CRUD DADOS DA IGREJA ====================
function crudDadosIgreja() {
  return {
    dadosIgreja: null,
    dadosBancarios: [],
    modalAberto: false,
    carregando: false,
    abaAtiva: 'igreja', // 'igreja' ou 'bancarios'
    formularioIgreja: {
      nome: '',
      nome_abreviado: '',
      denominacao: '',
      fundacao: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      whatsapp: '',
      email: '',
      email_secretaria: '',
      latitude: '',
      longitude: '',
      google_maps_embed: '',
      google_maps_url: '',
      waze_url: '',
      uber_url: '',
      culto_sexta_horario: '',
      culto_domingo_horario: '',
      secretaria_dias: '',
      secretaria_horario: '',
      atendimento_pastoral: '',
      atendimento_pastoral_telefone: '',
      pastor_nome: '',
      pastor_titulo: '',
      pastor_instagram: '',
      pastor_instagram_url: '',
      pastor_email: ''
    },
    formularioBancario: {
      favorecido: '',
      cnpj: '',
      banco_nome: '',
      banco_codigo: '',
      agencia: '',
      conta: '',
      pix_tipo: '',
      pix_chave: '',
      qrcode_url: '',
      qrcode_instrucoes: '',
      informacoes_mensagem: '',
      ativo: true
    },
    arquivoQRCode: null,
    previewQRCode: null,

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        // Carregar dados da igreja (deve ter apenas 1 registro)
        const dados = await window.supabaseClient.listar('dados_igreja');
        this.dadosIgreja = dados && dados.length > 0 ? dados[0] : null;
        
        if (this.dadosIgreja) {
          this.formularioIgreja = { ...this.dadosIgreja };
        }
        
        // Carregar dados bancários
        this.dadosBancarios = await window.supabaseClient.listar('dados_bancarios', {
          ordem: { campo: 'updated_at', ascendente: false }
        }) || [];
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        alert('Erro ao carregar dados');
      } finally {
        this.carregando = false;
      }
    },

    abrirModalBancario(dado = null) {
      if (dado) {
        this.formularioBancario = { 
          id: dado.id,
          favorecido: dado.favorecido || '',
          cnpj: dado.cnpj || '',
          banco_nome: dado.banco_nome || '',
          banco_codigo: dado.banco_codigo || '',
          agencia: dado.agencia || '',
          conta: dado.conta || '',
          pix_tipo: dado.pix_tipo || '',
          pix_chave: dado.pix_chave || '',
          qrcode_url: dado.qrcode_url || '',
          qrcode_instrucoes: dado.qrcode_instrucoes || '',
          informacoes_mensagem: dado.informacoes_mensagem || '',
          ativo: dado.ativo !== undefined ? dado.ativo : true
        };
        this.previewQRCode = dado.qrcode_url || null;
      } else {
        this.formularioBancario = {
          id: null,
          favorecido: '',
          cnpj: '',
          banco_nome: '',
          banco_codigo: '',
          agencia: '',
          conta: '',
          pix_tipo: '',
          pix_chave: '',
          qrcode_url: '',
          qrcode_instrucoes: '',
          informacoes_mensagem: '',
          ativo: true
        };
        this.previewQRCode = null;
      }
      this.arquivoQRCode = null;
      this.abaAtiva = 'bancarios';
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.arquivoQRCode = null;
      this.previewQRCode = null;
    },

    async selecionarQRCode(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }

      this.arquivoQRCode = arquivo;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewQRCode = e.target.result;
      };
      reader.readAsDataURL(arquivo);
    },

    async salvarIgreja() {
      if (!this.formularioIgreja.nome || !this.formularioIgreja.logradouro) {
        alert('Nome e endereço são obrigatórios');
        return;
      }

      this.carregando = true;

      try {
        if (this.dadosIgreja) {
          await window.supabaseClient.atualizar('dados_igreja', this.dadosIgreja.id, this.formularioIgreja);
        } else {
          await window.supabaseClient.criar('dados_igreja', this.formularioIgreja);
        }

        await this.carregar();
        alert('Dados da igreja salvos com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar dados da igreja:', erro);
        alert('Erro ao salvar: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async salvarBancario() {
      if (!this.formularioBancario.favorecido) {
        alert('Favorecido é obrigatório');
        return;
      }

      this.carregando = true;

      try {
        if (this.arquivoQRCode) {
          const url = await window.supabaseClient.uploadImagem(
            this.arquivoQRCode,
            'imagens',
            'pix/'
          );
          this.formularioBancario.qrcode_url = url;
        }

        // Verificar se está editando (se o formulário tem id)
        if (this.formularioBancario.id) {
          // Atualizar
          const { id, ...dadosParaAtualizar } = this.formularioBancario;
          await window.supabaseClient.atualizar('dados_bancarios', id, dadosParaAtualizar);
        } else {
          // Criar novo
          const { id, ...dadosParaCriar } = this.formularioBancario;
          await window.supabaseClient.criar('dados_bancarios', dadosParaCriar);
        }

        this.fecharModal();
        await this.carregar();
        alert('Dado bancário salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar dado bancário:', erro);
        alert('Erro ao salvar: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletarBancario(id) {
      if (!confirm('Tem certeza que deseja deletar este dado bancário?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('dados_bancarios', id);
        await this.carregar();
        alert('Dado bancário deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar dado bancário');
      } finally {
        this.carregando = false;
      }
    }
  };
}

// ==================== CRUD DADOS BANCÁRIOS ====================
function crudDadosBancarios() {
  return {
    dados: [],
    dadoEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      favorecido: '',
      cnpj: '',
      banco_nome: '',
      banco_codigo: '',
      agencia: '',
      conta: '',
      pix_tipo: '',
      pix_chave: '',
      qrcode_url: '',
      qrcode_instrucoes: '',
      informacoes_mensagem: '',
      ativo: true
    },
    arquivoQRCode: null,
    previewQRCode: null,

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        this.dados = await window.supabaseClient.listar('dados_bancarios', {
          ordem: { campo: 'updated_at', ascendente: false }
        });
      } catch (erro) {
        console.error('Erro ao carregar dados bancários:', erro);
        alert('Erro ao carregar dados bancários');
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(dado = null) {
      this.dadoEditando = dado;
      if (dado) {
        this.formulario = {
          favorecido: dado.favorecido || '',
          cnpj: dado.cnpj || '',
          banco_nome: dado.banco_nome || '',
          banco_codigo: dado.banco_codigo || '',
          agencia: dado.agencia || '',
          conta: dado.conta || '',
          pix_tipo: dado.pix_tipo || '',
          pix_chave: dado.pix_chave || '',
          qrcode_url: dado.qrcode_url || '',
          qrcode_instrucoes: dado.qrcode_instrucoes || '',
          informacoes_mensagem: dado.informacoes_mensagem || '',
          ativo: dado.ativo !== false
        };
        this.previewQRCode = dado.qrcode_url;
      } else {
        this.formulario = {
          favorecido: '',
          cnpj: '',
          banco_nome: '',
          banco_codigo: '',
          agencia: '',
          conta: '',
          pix_tipo: '',
          pix_chave: '',
          qrcode_url: '',
          qrcode_instrucoes: '',
          informacoes_mensagem: '',
          ativo: true
        };
        this.previewQRCode = null;
      }
      this.arquivoQRCode = null;
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.dadoEditando = null;
      this.formulario = {};
      this.arquivoQRCode = null;
      this.previewQRCode = null;
    },

    async selecionarQRCode(event) {
      const arquivo = event.target.files[0];
      if (!arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem');
        return;
      }

      this.arquivoQRCode = arquivo;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewQRCode = e.target.result;
      };
      reader.readAsDataURL(arquivo);
    },

    async salvar() {
      if (!this.formulario.favorecido) {
        alert('Favorecido é obrigatório');
        return;
      }

      this.carregando = true;

      try {
        if (this.arquivoQRCode) {
          const url = await window.supabaseClient.uploadImagem(
            this.arquivoQRCode,
            'imagens',
            'pix/'
          );
          this.formulario.qrcode_url = url;
        }

        if (this.dadoEditando) {
          await window.supabaseClient.atualizar('dados_bancarios', this.dadoEditando.id, this.formulario);
        } else {
          await window.supabaseClient.criar('dados_bancarios', this.formulario);
        }

        this.fecharModal();
        await this.carregar();
        alert('Dado bancário salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar dado bancário:', erro);
        alert('Erro ao salvar dado bancário: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este dado bancário?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('dados_bancarios', id);
        await this.carregar();
        alert('Dado bancário deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar dado bancário');
      } finally {
        this.carregando = false;
      }
    }
  };
}

// ==================== CRUD REDES SOCIAIS ====================
function crudRedesSociais() {
  return {
    redes: [],
    redeEditando: null,
    modalAberto: false,
    carregando: false,
    formulario: {
      nome: '',
      usuario: '',
      url: '',
      icone: '',
      cor: '#1A4731',
      descricao: '',
      ativo: true,
      ordem: 0,
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
    },
    iconesDisponiveis: [
      'bi-youtube', 'bi-instagram', 'bi-facebook', 'bi-whatsapp',
      'bi-telegram', 'bi-twitter-x', 'bi-tiktok', 'bi-globe',
      'bi-linkedin', 'bi-pinterest', 'bi-snapchat', 'bi-discord'
    ],

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        // Nota: Se a tabela redes_sociais não existir ainda, retornar array vazio
        try {
          this.redes = await window.supabaseClient.listar('redes_sociais', {
            ordem: { campo: 'ordem', ascendente: true }
          }) || [];
        } catch (erro) {
          console.warn('Tabela redes_sociais não existe ainda:', erro);
          this.redes = [];
        }
      } catch (erro) {
        console.error('Erro ao carregar redes sociais:', erro);
        this.redes = [];
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(rede = null) {
      this.redeEditando = rede;
      if (rede) {
        this.formulario = {
          nome: rede.nome || '',
          usuario: rede.usuario || '',
          url: rede.url || '',
          icone: rede.icone || '',
          cor: rede.cor || '#1A4731',
          descricao: rede.descricao || '',
          ativo: rede.ativo !== false,
          ordem: rede.ordem || 0,
          nivel_acesso: rede.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao']
        };
      } else {
        this.formulario = {
          nome: '',
          usuario: '',
          url: '',
          icone: '',
          cor: '#1A4731',
          descricao: '',
          ativo: true,
          ordem: 0,
          nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao']
        };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.redeEditando = null;
      this.formulario = {};
    },

    async salvar() {
      if (!this.formulario.nome || !this.formulario.url) {
        alert('Nome e URL são obrigatórios');
        return;
      }

      this.carregando = true;

      try {
        // Verificar se a tabela existe antes de salvar
        if (this.redeEditando) {
          await window.supabaseClient.atualizar('redes_sociais', this.redeEditando.id, this.formulario);
        } else {
          await window.supabaseClient.criar('redes_sociais', this.formulario);
        }

        this.fecharModal();
        await this.carregar();
        alert('Rede social salva com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar rede social:', erro);
        alert('Erro ao salvar rede social: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar esta rede social?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('redes_sociais', id);
        await this.carregar();
        alert('Rede social deletada com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar rede social');
      } finally {
        this.carregando = false;
      }
    }
  };
}

// ==================== CRUD TURMAS CATECÚMENOS ====================
function crudTurmasCatecumenos() {
  return {
    turmas: [],
    turmaEditando: null,
    modalAberto: false,
    carregando: false,
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
      etapa_atual: 1,
      total_etapas: 10,
      requer_aprovacao: true,
      status: 'aberta',
      ativo: true,
      nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao'],
      link_google_meet: '',
      link_whatsapp: ''
    },
    diasSemana: [
      { valor: 'domingo', label: 'Domingo' },
      { valor: 'segunda', label: 'Segunda-feira' },
      { valor: 'terca', label: 'Terça-feira' },
      { valor: 'quarta', label: 'Quarta-feira' },
      { valor: 'quinta', label: 'Quinta-feira' },
      { valor: 'sexta', label: 'Sexta-feira' },
      { valor: 'sabado', label: 'Sábado' }
    ],
    statusOptions: [
      { valor: 'aberta', label: 'Aberta para inscrições' },
      { valor: 'em_andamento', label: 'Em andamento' },
      { valor: 'encerrada', label: 'Encerrada' },
      { valor: 'cancelada', label: 'Cancelada' }
    ],

    async init() {
      await this.carregar();
    },

    async carregar() {
      this.carregando = true;
      try {
        const { data, error } = await window.supabaseClient.client
          .from('turmas_catecumenos')
          .select('*')
          .order('data_inicio', { ascending: false });
        
        if (error) throw error;
        this.turmas = data || [];
        
        // Contar inscritos por turma
        for (let turma of this.turmas) {
          const { count } = await window.supabaseClient.client
            .from('catecumenos')
            .select('*', { count: 'exact', head: true })
            .eq('turma_id', turma.id);
          turma.inscritos = count || 0;
        }
      } catch (erro) {
        console.error('Erro ao carregar turmas:', erro);
      } finally {
        this.carregando = false;
      }
    },

    abrirModal(turma = null) {
      this.turmaEditando = turma;
      if (turma) {
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
          etapa_atual: turma.etapa_atual || 1,
          total_etapas: turma.total_etapas || 10,
          requer_aprovacao: turma.requer_aprovacao !== false,
          status: turma.status || 'aberta',
          ativo: turma.ativo !== false,
          nivel_acesso: turma.nivel_acesso || ['visitante', 'membro', 'lideranca', 'administracao'],
          link_google_meet: turma.link_google_meet || '',
          link_whatsapp: turma.link_whatsapp || ''
        };
      } else {
        this.formulario = {
          nome: '',
          descricao: '',
          data_inicio: new Date().toISOString().split('T')[0],
          data_fim: '',
          dia_semana: '',
          horario: '',
          local: '',
          vagas: 20,
          instrutor: '',
          etapa_atual: 1,
          total_etapas: 10,
          requer_aprovacao: true,
          status: 'aberta',
          ativo: true,
          nivel_acesso: ['visitante', 'membro', 'lideranca', 'administracao'],
          link_google_meet: '',
          link_whatsapp: ''
        };
      }
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
        if (this.turmaEditando) {
          await window.supabaseClient.atualizar('turmas_catecumenos', this.turmaEditando.id, this.formulario);
        } else {
          await window.supabaseClient.criar('turmas_catecumenos', this.formulario);
        }

        this.fecharModal();
        await this.carregar();
        alert('Turma salva com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar turma:', erro);
        alert('Erro ao salvar turma: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar esta turma? Os catecúmenos associados perderão o vínculo.')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('turmas_catecumenos', id);
        await this.carregar();
        alert('Turma deletada com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar turma');
      } finally {
        this.carregando = false;
      }
    },

    formatarData(data) {
      if (!data) return '-';
      return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    },

    formatarDiaSemana(dia) {
      const encontrado = this.diasSemana.find(d => d.valor === dia);
      return encontrado ? encontrado.label : dia || '-';
    },

    getStatusBadge(status) {
      const badges = {
        'aberta': 'badge-success',
        'em_andamento': 'badge-info',
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

// ==================== CRUD CATECÚMENOS ====================
function crudCatecumenos() {
  return {
    catecumenos: [],
    turmas: [],
    catecumenoEditando: null,
    modalAberto: false,
    modalDetalhesAberto: false,
    catecumenoSelecionado: null,
    carregando: false,
    filtroStatus: 'todos',
    filtroTurma: 'todas',
    busca: '',
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
      status: 'pendente',
      observacoes: ''
    },
    estadosCivis: [
      { valor: 'solteiro', label: 'Solteiro(a)' },
      { valor: 'casado', label: 'Casado(a)' },
      { valor: 'divorciado', label: 'Divorciado(a)' },
      { valor: 'viuvo', label: 'Viúvo(a)' },
      { valor: 'outro', label: 'Outro' }
    ],
    statusOptions: [
      { valor: 'pendente', label: 'Pendente' },
      { valor: 'aprovado', label: 'Aprovado' },
      { valor: 'em_andamento', label: 'Em Andamento' },
      { valor: 'concluido', label: 'Concluído' },
      { valor: 'desistente', label: 'Desistente' }
    ],

    async init() {
      await Promise.all([
        this.carregar(),
        this.carregarTurmas()
      ]);
    },

    async carregar() {
      this.carregando = true;
      try {
        const { data, error } = await window.supabaseClient.client
          .from('catecumenos')
          .select(`
            *,
            turma:turmas_catecumenos(id, nome)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        this.catecumenos = data || [];
      } catch (erro) {
        console.error('Erro ao carregar catecúmenos:', erro);
      } finally {
        this.carregando = false;
      }
    },

    async carregarTurmas() {
      try {
        const { data, error } = await window.supabaseClient.client
          .from('turmas_catecumenos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');
        
        if (error) throw error;
        this.turmas = data || [];
      } catch (erro) {
        console.error('Erro ao carregar turmas:', erro);
      }
    },

    get catecumenosFiltrados() {
      return this.catecumenos.filter(c => {
        // Filtro de status
        if (this.filtroStatus !== 'todos' && c.status !== this.filtroStatus) {
          return false;
        }
        
        // Filtro de turma
        if (this.filtroTurma !== 'todas') {
          if (this.filtroTurma === 'sem_turma' && c.turma_id) return false;
          if (this.filtroTurma !== 'sem_turma' && c.turma_id !== this.filtroTurma) return false;
        }
        
        // Busca
        if (this.busca.trim()) {
          const termo = this.busca.toLowerCase();
          return (
            c.nome.toLowerCase().includes(termo) ||
            (c.email && c.email.toLowerCase().includes(termo)) ||
            c.telefone.includes(termo)
          );
        }
        
        return true;
      });
    },

    abrirModal(catecumeno = null) {
      this.catecumenoEditando = catecumeno;
      if (catecumeno) {
        this.formulario = {
          nome: catecumeno.nome || '',
          email: catecumeno.email || '',
          telefone: catecumeno.telefone || '',
          data_nascimento: catecumeno.data_nascimento || '',
          endereco: catecumeno.endereco || '',
          estado_civil: catecumeno.estado_civil || '',
          profissao: catecumeno.profissao || '',
          como_conheceu: catecumeno.como_conheceu || '',
          ja_batizado: catecumeno.ja_batizado || false,
          igreja_anterior: catecumeno.igreja_anterior || '',
          motivacao: catecumeno.motivacao || '',
          disponibilidade: catecumeno.disponibilidade || '',
          turma_id: catecumeno.turma_id || '',
          status: catecumeno.status || 'pendente',
          observacoes: catecumeno.observacoes || ''
        };
      } else {
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
          status: 'pendente',
          observacoes: ''
        };
      }
      this.modalAberto = true;
    },

    fecharModal() {
      this.modalAberto = false;
      this.catecumenoEditando = null;
    },

    verDetalhes(catecumeno) {
      this.catecumenoSelecionado = catecumeno;
      this.modalDetalhesAberto = true;
    },

    fecharDetalhes() {
      this.modalDetalhesAberto = false;
      this.catecumenoSelecionado = null;
    },

    async salvar() {
      if (!this.formulario.nome || !this.formulario.telefone) {
        alert('Nome e telefone são obrigatórios');
        return;
      }

      this.carregando = true;
      try {
        const dados = { ...this.formulario };
        if (!dados.turma_id) dados.turma_id = null;
        if (!dados.data_nascimento) dados.data_nascimento = null;

        if (this.catecumenoEditando) {
          await window.supabaseClient.atualizar('catecumenos', this.catecumenoEditando.id, dados);
        } else {
          await window.supabaseClient.criar('catecumenos', dados);
        }

        this.fecharModal();
        await this.carregar();
        alert('Catecúmeno salvo com sucesso!');
      } catch (erro) {
        console.error('Erro ao salvar catecúmeno:', erro);
        alert('Erro ao salvar catecúmeno: ' + erro.message);
      } finally {
        this.carregando = false;
      }
    },

    async atualizarStatus(catecumeno, novoStatus) {
      try {
        await window.supabaseClient.atualizar('catecumenos', catecumeno.id, { status: novoStatus });
        catecumeno.status = novoStatus;
        alert('Status atualizado com sucesso!');
      } catch (erro) {
        console.error('Erro ao atualizar status:', erro);
        alert('Erro ao atualizar status');
      }
    },

    async atribuirTurma(catecumeno, turmaId) {
      try {
        await window.supabaseClient.atualizar('catecumenos', catecumeno.id, { turma_id: turmaId || null });
        await this.carregar();
        alert('Turma atribuída com sucesso!');
      } catch (erro) {
        console.error('Erro ao atribuir turma:', erro);
        alert('Erro ao atribuir turma');
      }
    },

    async deletar(id) {
      if (!confirm('Tem certeza que deseja deletar este catecúmeno?')) return;

      this.carregando = true;
      try {
        await window.supabaseClient.deletar('catecumenos', id);
        await this.carregar();
        if (this.modalDetalhesAberto) this.fecharDetalhes();
        alert('Catecúmeno deletado com sucesso!');
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
        alert('Erro ao deletar catecúmeno');
      } finally {
        this.carregando = false;
      }
    },

    formatarData(data) {
      if (!data) return '-';
      return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
    },

    formatarDataHora(data) {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
        'Data Nascimento': this.formatarData(c.data_nascimento),
        'Estado Civil': c.estado_civil || '',
        Status: this.getStatusTexto(c.status),
        Turma: c.turma?.nome || 'Sem turma',
        'Data Inscrição': this.formatarDataHora(c.created_at)
      }));
      
      if (dados.length === 0) {
        alert('Nenhum dado para exportar');
        return;
      }
      
      const headers = Object.keys(dados[0]);
      let csv = headers.join(',') + '\n';
      
      dados.forEach(row => {
        csv += headers.map(h => `"${row[h]}"`).join(',') + '\n';
      });
      
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `catecumenos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };
}

