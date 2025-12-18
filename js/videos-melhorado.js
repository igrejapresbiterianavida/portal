// ============================================
// VIDEOS-MELHORADO.JS - Sistema de Vídeos Aprimorado
// Paginação, modos de visualização, duração, etc.
// ============================================

/**
 * Componente Alpine.js para vídeos melhorado
 */
function videosYoutubeMelhorado() {
  return {
    todosVideos: [],
    live: null,
    carregando: true,
    
    // Paginação
    paginaAtual: 1,
    itensPorPagina: 12, // 4 colunas x 3 linhas
    
    // Modos de visualização
    modoVisualizacao: 'grid', // 'grid', 'lista', 'cheio'
    
    // Modal
    modalLiveAberto: false,
    
    // Cache de durações
    duracoes: {},
    
    init() {
      console.log('🎬 Inicializando sistema de vídeos melhorado...');
      
      // Restaurar preferências do usuário
      this.restaurarPreferencias();
      
      // Carregar vídeos
      this.carregarVideos();
      
      // Verificar live
      this.verificarLive();
      
      // Verificar live a cada 2 minutos
      setInterval(() => this.verificarLive(), 120000);
    },
    
    restaurarPreferencias() {
      const modo = localStorage.getItem('ipv_videos_modo');
      if (modo && ['grid', 'lista', 'cheio'].includes(modo)) {
        this.modoVisualizacao = modo;
        this.ajustarItensPorPagina();
      }
    },
    
    salvarPreferencias() {
      localStorage.setItem('ipv_videos_modo', this.modoVisualizacao);
    },
    
    ajustarItensPorPagina() {
      if (this.modoVisualizacao === 'grid') {
        // Desktop: 4 colunas x 3 linhas = 12 vídeos
        // Mobile: 2 colunas x 3 linhas = 6 vídeos (mas mantemos 12 para consistência)
        this.itensPorPagina = 12;
      } else if (this.modoVisualizacao === 'lista') {
        this.itensPorPagina = 4;
      } else if (this.modoVisualizacao === 'cheio') {
        this.itensPorPagina = 3;
      }
    },
    
    async verificarLive() {
      try {
        if (typeof window.verificarLiveYouTube === 'function') {
          const statusLive = await window.verificarLiveYouTube();
          this.live = statusLive;
          if (statusLive && statusLive.aoVivo) {
            console.log('🔴 Live detectado:', statusLive.titulo);
          }
        } else {
          this.live = { aoVivo: false };
        }
      } catch (erro) {
        console.error('Erro ao verificar live:', erro);
        this.live = { aoVivo: false };
      }
    },
    
    async carregarVideos() {
      this.carregando = true;
      console.log('📹 Carregando vídeos...');
      
      try {
        let videos = [];
        
        // 1. SEMPRE tentar buscar do YouTube via RSS Feed primeiro (prioridade máxima)
        console.log('🔍 Buscando vídeos do YouTube RSS...');
        try {
          if (typeof window.buscarTodosVideosYouTube === 'function') {
            const videosYT = await window.buscarTodosVideosYouTube();
            if (videosYT && videosYT.length > 0) {
              console.log(`✅ ${videosYT.length} vídeos do YouTube RSS`);
              videos = videosYT.map(v => this.formatarVideo(v, 'youtube'));
            }
          }
        } catch (erroYT) {
          console.warn('⚠️ Erro ao buscar do YouTube RSS:', erroYT.message);
        }
        
        // 2. Se não conseguiu do YouTube, tentar Edge Function
        if (videos.length === 0 && window.supabaseClient && window.supabaseClient.executarFuncao) {
          console.log('🔍 Tentando buscar vídeos via Edge Function...');
          try {
            const resultado = await window.supabaseClient.executarFuncao('buscar-videos-youtube', {});
            if (resultado && resultado.videos && resultado.videos.length > 0) {
              console.log(`✅ ${resultado.videos.length} vídeos via Edge Function`);
              videos = resultado.videos.map(v => this.formatarVideo(v, 'youtube'));
            }
          } catch (erroEdge) {
            console.warn('⚠️ Edge Function não disponível:', erroEdge.message);
          }
        }
        
        // 3. Se não conseguiu do YouTube, tentar Supabase (tabela videos)
        if (videos.length === 0 && window.supabaseClient && window.supabaseClient.client) {
          console.log('📦 Tentando buscar do Supabase...');
          try {
            const videosDB = await window.supabaseClient.listar('videos', {
              ordem: { campo: 'data_publicacao', ascendente: false },
              limite: 50
            });
            if (videosDB && videosDB.length > 0) {
              console.log(`✅ ${videosDB.length} vídeos do Supabase`);
              videos = videosDB.map(v => this.formatarVideo(v, 'supabase'));
            }
          } catch (erroDB) {
            console.warn('⚠️ Erro ao buscar do Supabase:', erroDB.message);
          }
        }
        
        // 4. Complementar com vídeos do Supabase (que não vieram do YouTube)
        if (videos.length > 0 && window.supabaseClient && window.supabaseClient.client) {
          try {
            const videosDB = await window.supabaseClient.listar('videos', {
              ordem: { campo: 'data_publicacao', ascendente: false },
              limite: 50
            });
            if (videosDB && videosDB.length > 0) {
              const idsExistentes = new Set(videos.map(v => v.video_id || v.id));
              const novosVideos = videosDB
                .filter(v => !idsExistentes.has(v.video_id))
                .map(v => this.formatarVideo(v, 'supabase'));
              if (novosVideos.length > 0) {
                console.log(`✅ ${novosVideos.length} vídeos complementares do Supabase`);
                videos = [...videos, ...novosVideos];
              }
            }
          } catch (erroDB) {
            console.warn('⚠️ Erro ao complementar do Supabase:', erroDB.message);
          }
        }
        
        // 5. Se ainda não tem vídeos, tentar JSON local
        if (videos.length === 0 && window.dataManager) {
          console.log('📂 Tentando buscar do JSON local...');
          try {
            const dadosJSON = await window.dataManager.carregarVideos();
            if (dadosJSON && dadosJSON.videos && dadosJSON.videos.length > 0) {
              console.log(`✅ ${dadosJSON.videos.length} vídeos do JSON`);
              videos = dadosJSON.videos.map(v => this.formatarVideo(v, 'json'));
            }
          } catch (erroJSON) {
            console.warn('⚠️ Erro ao buscar do JSON:', erroJSON.message);
          }
        }
        
        // Ordenar por data (mais recente primeiro)
        videos.sort((a, b) => {
          const dataA = a.dataPublicacao || a.data || '';
          const dataB = b.dataPublicacao || b.data || '';
          return dataB.localeCompare(dataA);
        });
        
        // Filtrar por nível de acesso
        videos = videos.filter(v => this.podeVerConteudo(v.nivel_acesso));
        
        this.todosVideos = videos;
        console.log(`🎬 Total: ${this.todosVideos.length} vídeos carregados (após filtro de acesso)`);
        
      } catch (erro) {
        console.error('❌ Erro ao carregar vídeos:', erro);
        this.todosVideos = [];
      } finally {
        this.carregando = false;
      }
    },
    
    formatarVideo(v, origem) {
      const videoId = v.video_id || v.id || '';
      return {
        id: videoId,
        video_id: videoId,
        titulo: v.titulo || v.title || '',
        descricao: v.descricao || v.description || '',
        thumbnail: v.thumbnail || v.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: v.url || `https://www.youtube.com/watch?v=${videoId}`,
        data: v.data || (v.dataPublicacao ? v.dataPublicacao.split('T')[0] : (v.data_publicacao ? v.data_publicacao.split('T')[0] : null)),
        dataPublicacao: v.dataPublicacao || v.data_publicacao,
        duracao: v.duracao || null,
        origem: origem,
        // Incluir nível de acesso (vídeos do YouTube são públicos por padrão)
        nivel_acesso: v.nivel_acesso || (origem === 'youtube' ? ['visitante', 'membro', 'lideranca', 'administracao'] : null)
      };
    },
    
    // Computed: vídeos da página atual
    get videosPaginados() {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
      const fim = inicio + this.itensPorPagina;
      return this.todosVideos.slice(inicio, fim);
    },
    
    // Computed: total de páginas
    get totalPaginas() {
      return Math.ceil(this.todosVideos.length / this.itensPorPagina);
    },
    
    // Navegação
    paginaAnterior() {
      if (this.paginaAtual > 1) {
        this.paginaAtual--;
        this.scrollParaSecao();
      }
    },
    
    proximaPagina() {
      if (this.paginaAtual < this.totalPaginas) {
        this.paginaAtual++;
        this.scrollParaSecao();
      }
    },
    
    irParaPagina(pagina) {
      if (pagina >= 1 && pagina <= this.totalPaginas) {
        this.paginaAtual = pagina;
        this.scrollParaSecao();
      }
    },
    
    scrollParaSecao() {
      const secao = document.getElementById('videos');
      if (secao) {
        const offsetTop = secao.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    },
    
    // Modos de visualização
    mudarModo(modo) {
      this.modoVisualizacao = modo;
      this.ajustarItensPorPagina();
      this.paginaAtual = 1; // Voltar para primeira página
      this.salvarPreferencias();
    },
    
    // Live
    assistirAoVivo() {
      if (this.live && this.live.aoVivo) {
        this.modalLiveAberto = true;
        document.body.style.overflow = 'hidden';
      } else {
        alert('Não há transmissão ao vivo no momento. Inscreva-se para ser notificado!');
      }
    },
    
    fecharModalLive() {
      this.modalLiveAberto = false;
      document.body.style.overflow = '';
    },
    
    inscreverCanal() {
      window.open('https://youtube.com/@ipbvida?sub_confirmation=1', '_blank');
    },
    
    // Formatação
    formatarData(dataString) {
      if (!dataString) return '';
      try {
        const data = new Date(dataString + (dataString.includes('T') ? '' : 'T00:00:00'));
        return data.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
        });
      } catch {
        return dataString;
      }
    },
    
    /**
     * Verifica se o usuário pode ver o conteúdo baseado no nível de acesso
     */
    podeVerConteudo(nivelAcesso) {
      // Se não tem nível de acesso definido, é público
      if (!nivelAcesso || nivelAcesso.length === 0) return true;
      if (nivelAcesso.includes('visitante')) return true;
      
      // Verificar se há controle de acesso disponível
      if (window.controleAcesso) {
        return window.controleAcesso.podeAcessar(nivelAcesso);
      }
      
      // Verificar via localStorage
      const tipoUsuario = this.obterTipoUsuario();
      
      if (tipoUsuario === 'administracao') return true;
      if (nivelAcesso.includes('membro') && ['membro', 'lideranca', 'administracao'].includes(tipoUsuario)) return true;
      if (nivelAcesso.includes('lideranca') && ['lideranca', 'administracao'].includes(tipoUsuario)) return true;
      
      return false;
    },
    
    /**
     * Obtém o tipo do usuário atual
     */
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
    }
  };
}

// Registrar globalmente
window.videosYoutubeMelhorado = videosYoutubeMelhorado;
