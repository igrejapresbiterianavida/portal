// ============================================
// APLICACAO.JS - Controle Principal Alpine.js
// ============================================

// Componente Principal
function aplicacao() {
  return {
    menuAberto: false,
    
    init() {
      console.log('IPV Online Iniciado');
      this.configurarScrollSuave();
      this.revelarElementosNoScroll();
    },
    
    fecharMenu() {
      this.menuAberto = false;
    },
    
    configurarScrollSuave() {
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          console.log('🔗 Scroll suave interceptou:', link.getAttribute('href'));
          e.preventDefault();
          const id = link.getAttribute('href');
          if (id === '#') return;
          
          const elemento = document.querySelector(id);
          if (elemento) {
            const offsetTop = elemento.offsetTop - 70;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
            this.fecharMenu();
          }
        });
      });
    },
    
    revelarElementosNoScroll() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revelado');
          }
        });
      }, { threshold: 0.1 });
      
      document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
      });
    }
  };
}

// Carrossel Devocionais
function carrosselDevocionais() {
  return {
    slideAtual: 0,
    autoplay: null,
    versiculoDia: {
      texto: '"Carregando."',
      referencia: 'Carregando'
    },
    salmoDia: {
      texto: '"Carregando."',
      referencia: 'Carregando'
      },
    proberbioDia: {
      texto: '"Carregando."',
      referencia: 'Carregando'
      },
    
    init() {
      this.carregarVersiculos();
      this.iniciarAutoplay();
    },
    
    async carregarVersiculos() {
      try {
        // Verificar se já existem versículos salvos no localStorage
        const cacheKey = 'versiculos_dia_cache';
        const cache = localStorage.getItem(cacheKey);
        
        if (cache) {
          const dados = JSON.parse(cache);
          const agora = new Date().getTime();
          const tempoDecorrido = agora - dados.timestamp;
          const horasDecorridas = tempoDecorrido / (1000 * 60 * 60);
          
          // Se passou menos de 24 horas, usar cache
          if (horasDecorridas < 24) {
            console.log(`🔒 Usando versículos em cache (${Math.floor(horasDecorridas)}h${Math.floor((horasDecorridas % 1) * 60)}min atrás)`);
            this.versiculoDia = dados.versiculoDia;
            this.salmoDia = dados.salmoDia;
            this.proberbioDia = dados.proberbioDia;
            console.log('✅ Versículos carregados do cache!');
            return;
          } else {
            console.log('⏰ Cache expirou (24h), buscando novos versículos...');
          }
        }
        
        // Buscar novos versículos da API
        console.log('🔄 Buscando novos versículos da API...');
        
        // Buscar Versículo do Dia usando bible-api.com
        const versiculoDados = await buscarVersiculoAleatorio();
        console.log('📖 Versículo recebido:', versiculoDados);
        if (versiculoDados) {
          this.versiculoDia = {
            texto: `"${versiculoDados.texto}"`,
            referencia: versiculoDados.referencia
          };
          console.log('✅ Versículo do Dia atualizado:', this.versiculoDia);
        } else {
          console.warn('⚠️ Versículo do Dia não retornou dados');
        }
        
        // Buscar Salmo do Dia
        const salmoDados = await buscarSalmoAleatorio();
        console.log('📖 Salmo recebido:', salmoDados);
        if (salmoDados) {
          this.salmoDia = {
            texto: `"${salmoDados.texto}"`,
            referencia: salmoDados.referencia
          };
          console.log('✅ Salmo do Dia atualizado:', this.salmoDia);
        } else {
          console.warn('⚠️ Salmo do Dia não retornou dados');
        }
        
        // Buscar Provérbio do Dia
        const proverbioDados = await buscarProverbioAleatorio();
        console.log('📖 Provérbio recebido:', proverbioDados);
        if (proverbioDados) {
          this.proberbioDia = {
            texto: `"${proverbioDados.texto}"`,
            referencia: proverbioDados.referencia
          };
          console.log('✅ Provérbio do Dia atualizado:', this.proberbioDia);
        } else {
          console.warn('⚠️ Provérbio do Dia não retornou dados');
        }
        
        // Salvar no localStorage com timestamp
        const dadosCache = {
          timestamp: new Date().getTime(),
          versiculoDia: this.versiculoDia,
          salmoDia: this.salmoDia,
          proberbioDia: this.proberbioDia
        };
        localStorage.setItem(cacheKey, JSON.stringify(dadosCache));
        console.log('💾 Versículos salvos em cache (válido por 24h)');
        
        console.log('✅ Versículos carregados da Bible API com sucesso!');
      } catch (erro) {
        console.error('❌ Erro ao carregar versículos:', erro);
        console.log('⚠️ Usando versículos padrão');
      }
    },
    
    proximo() {
      this.slideAtual = (this.slideAtual + 1) % 3;
      this.resetarAutoplay();
    },
    
    anterior() {
      this.slideAtual = this.slideAtual === 0 ? 2 : this.slideAtual - 1;
      this.resetarAutoplay();
    },
    
    irPara(index) {
      this.slideAtual = index;
      this.resetarAutoplay();
    },
    
    iniciarAutoplay() {
      this.autoplay = setInterval(() => {
        this.proximo();
      }, 5000);
    },
    
    resetarAutoplay() {
      clearInterval(this.autoplay);
      this.iniciarAutoplay();
    }
  };
}

// Devocional Diário com Imagem e Texto
function devocionalDiario() {
  return {
    devocional: null,
    textoExpandido: false,
    
    async carregar() {
      try {
        // Carregar do Supabase
        if (window.supabaseClient) {
          const devocional = await window.supabaseClient.getDevocionalAtivo();
          
          if (devocional) {
            const imagemUrl = devocional.imagem_url || '';
            // Adicionar timestamp para forçar atualização da imagem (evita cache)
            const imagemComCache = imagemUrl ? (imagemUrl.includes('?') ? imagemUrl : imagemUrl + '?t=' + Date.now()) : 'assets/images/corrida.jpg?t=' + Date.now();
            
            this.devocional = {
              id: devocional.id,
              titulo: devocional.titulo || '',
              texto: devocional.texto || '',
              imagem: imagemComCache, // Campo usado no HTML com cache busting
              imagem_url: imagemUrl, // Mantém compatibilidade
              data_publicacao: devocional.data_publicacao || new Date().toISOString().split('T')[0],
              ativo: devocional.ativo
            };
            console.log('✅ Devocional diário carregado do Supabase:', this.devocional.id, 'Imagem:', this.devocional.imagem);
            return;
          }
        }
        
        console.warn('⚠️ Nenhum devocional encontrado no Supabase');
      } catch (erro) {
        console.error('❌ Erro ao carregar devocional diário:', erro);
      }
    },
    
    get textoExibido() {
      if (!this.devocional) return '';
      
      if (this.textoExpandido || this.devocional.texto.length <= 350) {
        return this.devocional.texto;
      }
      
      return this.devocional.texto.substring(0, 350) + '...';
    }
  };
}

// Vídeos YouTube e Live
function videosYoutube() {
  return {
    videos: [],
    live: null,
    carregando: true,
    
    init() {
      this.verificarLive();
      this.carregarVideos();
      // Verificar live a cada 2 minutos
      setInterval(() => this.verificarLive(), 120000);
    },
    
    async verificarLive() {
      try {
        // Verificar live via RSS (limitado - RSS não indica diretamente se está ao vivo)
        if (typeof verificarLiveYouTube === 'function') {
          const statusLive = await verificarLiveYouTube();
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
      try {
        const todosVideos = [];
        
        // 1. PRIORIDADE: Buscar TODOS os vídeos via RSS Feed do YouTube
        console.log('🔍 Buscando TODOS os vídeos do canal YouTube via RSS Feed...');
        try {
          let videosYouTube = [];
          
          // Tentar usar a função que busca todos os vídeos
          if (typeof window.buscarTodosVideosYouTube === 'function') {
            console.log('📹 Usando buscarTodosVideosYouTube (busca completa)...');
            videosYouTube = await window.buscarTodosVideosYouTube();
          } else if (typeof buscarTodosVideosYouTube === 'function') {
            console.log('📹 Usando buscarTodosVideosYouTube (global)...');
            videosYouTube = await buscarTodosVideosYouTube();
          } else if (typeof window.buscarVideosYouTube === 'function') {
            // Fallback: buscar 50 vídeos (máximo por requisição)
            console.log('📹 Usando buscarVideosYouTube (fallback - 50 vídeos)...');
            videosYouTube = await window.buscarVideosYouTube(50);
          } else {
            console.error('❌ Função de buscar vídeos do YouTube não encontrada!');
          }
          
          if (videosYouTube && videosYouTube.length > 0) {
            console.log(`📹 ${videosYouTube.length} vídeos retornados do RSS Feed do YouTube`);
            
            // Formatar vídeos do YouTube
            const videosFormatados = videosYouTube.map(v => ({
              id: v.video_id || v.id,
              video_id: v.video_id || v.id,
              titulo: v.titulo || '',
              descricao: v.descricao || '',
              thumbnail: v.thumbnail || v.thumbnail_url || `https://i.ytimg.com/vi/${v.video_id || v.id}/hqdefault.jpg`,
              thumbnail_url: v.thumbnail || v.thumbnail_url || `https://i.ytimg.com/vi/${v.video_id || v.id}/hqdefault.jpg`,
              url: v.url || `https://www.youtube.com/watch?v=${v.video_id || v.id}`,
              data: v.dataPublicacao ? v.dataPublicacao.split('T')[0] : (v.data_publicacao ? v.data_publicacao.split('T')[0] : null),
              dataPublicacao: v.dataPublicacao || v.data_publicacao,
              duracao: v.duracao || null,
              visualizacoes: v.visualizacoes || 0,
              origem: 'youtube',
              prioridade: 1 // Prioridade alta para vídeos do YouTube
            }));
            
            todosVideos.push(...videosFormatados);
            console.log(`✅ ${videosFormatados.length} vídeos do YouTube adicionados (PRIORIDADE)`);
          } else {
            console.warn('⚠️ Nenhum vídeo retornado do RSS Feed do YouTube');
            console.warn('💡 Continuando com vídeos do Supabase...');
          }
        } catch (erroYouTube) {
          console.error('❌ Erro ao buscar vídeos do YouTube:', erroYouTube);
          console.warn('💡 Continuando com vídeos do Supabase...');
        }
        
        // 2. Carregar vídeos do Supabase (cadastrados manualmente) - como complemento
        if (window.supabaseClient) {
          try {
            const videosSupabase = await window.supabaseClient.listar('videos', {
              ordem: { campo: 'data_publicacao', ascendente: false },
              limite: 20
            });
            
            if (videosSupabase && videosSupabase.length > 0) {
              // Filtrar vídeos que já estão no YouTube
              const idsYouTube = new Set(todosVideos.map(v => v.video_id || v.id));
              
              const videosFormatados = videosSupabase
                .filter(v => {
                  const videoId = v.video_id || v.id;
                  return videoId && !idsYouTube.has(videoId); // Apenas vídeos que não estão no YouTube
                })
                .map(v => ({
                  id: v.video_id || v.id,
                  video_id: v.video_id,
                  titulo: v.titulo || '',
                  descricao: v.descricao || '',
                  thumbnail: v.thumbnail_url || `https://i.ytimg.com/vi/${v.video_id}/hqdefault.jpg`,
                  url: v.url || `https://www.youtube.com/watch?v=${v.video_id}`,
                  data: v.data_publicacao ? v.data_publicacao.split('T')[0] : null,
                  dataPublicacao: v.data_publicacao,
                  duracao: v.duracao || null,
                  visualizacoes: v.visualizacoes || 0,
                  origem: 'supabase',
                  prioridade: 2 // Prioridade menor para vídeos do Supabase
                }));
              
              todosVideos.push(...videosFormatados);
              console.log(`✅ ${videosFormatados.length} vídeos adicionados do Supabase (complemento)`);
            }
          } catch (erroSupabase) {
            console.error('Erro ao carregar vídeos do Supabase:', erroSupabase);
          }
        }
        
        // 3. Ordenar: primeiro por prioridade (YouTube primeiro), depois por data (mais recentes primeiro)
        todosVideos.sort((a, b) => {
          // Primeiro ordena por prioridade (1 = YouTube, 2 = Supabase)
          const prioridadeA = a.prioridade || 2;
          const prioridadeB = b.prioridade || 2;
          if (prioridadeA !== prioridadeB) {
            return prioridadeA - prioridadeB; // YouTube primeiro
          }
          // Se mesma prioridade, ordena por data
          const dataA = a.dataPublicacao || a.data || '';
          const dataB = b.dataPublicacao || b.data || '';
          return dataB.localeCompare(dataA); // Mais recentes primeiro
        });
        
        // Não limitar - mostrar todos os vídeos do YouTube
        this.videos = todosVideos;
        
        if (this.videos.length > 0) {
          const videosYouTube = todosVideos.filter(v => v.origem === 'youtube').length;
          const videosSupabase = todosVideos.filter(v => v.origem === 'supabase').length;
          console.log(`✅ Total de ${this.videos.length} vídeos carregados (${videosYouTube} do YouTube com PRIORIDADE, ${videosSupabase} do Supabase)`);
        } else {
          console.warn('⚠️ Nenhum vídeo encontrado');
          console.warn('💡 Verifique se há vídeos cadastrados no Supabase ou se o Canal ID está correto');
        }
      } catch (erro) {
        console.error('❌ Erro ao carregar vídeos:', erro);
        this.videos = [];
      } finally {
        this.carregando = false;
      }
    },
        
        inscreverCanal() {
          window.open('https://youtube.com/@ipbvida?sub_confirmation=1', '_blank');
        },
        
        assistirAoVivo() {
          if (this.live && this.live.aoVivo) {
            // Abrir modal com player de live
            this.abrirModalLive();
          } else {
            alert('Não há transmissão ao vivo no momento. Inscreva-se para ser notificado!');
          }
        },
        
        modalLiveAberto: false,
        
        abrirModalLive() {
          this.modalLiveAberto = true;
          // Prevenir scroll do body quando modal estiver aberto
          document.body.style.overflow = 'hidden';
        },
        
        fecharModalLive() {
          this.modalLiveAberto = false;
          document.body.style.overflow = '';
        },
        
        formatarData(dataString) {
          if (!dataString) return '';
          const data = new Date(dataString + 'T00:00:00');
          return data.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
          });
        }
        };
      }

      // Programação
      function programacaoIgreja() {
        return {
        slideAtual: 0,
        programas: [],
        gruposBanners: [],
        
        async init() {
      await this.carregarProgramacao();
      this.agruparBanners();
      this.iniciarAutoPlay();
    },
    
    async carregarProgramacao() {
      try {
        // Carregar do Supabase
        if (window.supabaseClient) {
          const programacao = await window.supabaseClient.listar('programacao', {
            ordem: { campo: 'dia', ascendente: true }
          });
          
          if (programacao && programacao.length > 0) {
            this.programas = programacao.map(p => ({
              id: p.id,
              titulo: p.titulo || '',
              descricao: p.descricao || '',
              dia: p.dia || '',
              mes: p.mes || '',
              horario: p.horario || '',
              local: p.local || '',
              categoria: p.categoria || 'GERAL',
              corCategoria: p.cor_categoria || '#1A4731',
              link: p.link || '#',
              cor1: p.cor1 || '#1A4731',
              cor2: p.cor2 || '#2D5F4A',
              imagem: p.imagem_url || 'assets/images/programacao/default.svg'
            }));
            console.log(`✅ ${this.programas.length} programas carregados do Supabase`);
            return;
          }
        }
        
        // Se não encontrou no Supabase, deixar vazio
        if (!this.programas || this.programas.length === 0) {
          console.warn('⚠️ Nenhuma programação encontrada no Supabase');
          this.programas = [];
        }
      } catch (erro) {
        console.error('❌ Erro ao carregar programação:', erro);
        // Manter programas vazios ou usar fallback mínimo
        if (!this.programas || this.programas.length === 0) {
          this.programas = [];
        }
      }
    },
    
    agruparBanners() {
      // Agrupa os primeiros 6 programas em grupos de 3 para o carrossel
      const banners = this.programas.slice(0, 6);
      this.gruposBanners = [];
      for (let i = 0; i < banners.length; i += 3) {
        this.gruposBanners.push(banners.slice(i, i + 3));
      }
    },
    
    proximoSlide() {
      // Usa 6 programas individuais em vez de grupos
      this.slideAtual = (this.slideAtual + 1) % 6;
    },
    
    anteriorSlide() {
      // Usa 6 programas individuais em vez de grupos
      this.slideAtual = this.slideAtual === 0 ? 5 : this.slideAtual - 1;
    },
    
    iniciarAutoPlay() {
      setInterval(() => {
        this.proximoSlide();
      }, 5000);
    }
  };
}

// Eventos
function eventosIgreja() {
  return {
    eventos: [],
    
    init() {
      this.carregarEventos();
    },
    
    async carregarEventos() {
      try {
        // Carregar do Supabase
        if (window.supabaseClient) {
          const eventos = await window.supabaseClient.listar('eventos', {
            filtro: { campo: 'ativo', operador: 'eq', valor: true },
            ordem: { campo: 'data', ascendente: true },
            limite: 10
          });
          
          if (eventos && eventos.length > 0) {
            this.eventos = eventos.map(e => ({
              id: e.id,
              titulo: e.titulo || '',
              descricao: e.descricao || '',
              data: e.data ? e.data.split('T')[0] : null,
              horario: e.horario || '',
              local: e.local || '',
              imagem: e.imagem_url || 'assets/images/foto-igreja.png',
              link: e.link_inscricao || null,
              inscricao_aberta: e.inscricao_aberta || false
            }));
            console.log(`✅ ${this.eventos.length} eventos carregados do Supabase`);
            return;
          }
        }
        
        // Se não encontrou no Supabase, deixar vazio
        if (!this.eventos || this.eventos.length === 0) {
          console.warn('⚠️ Nenhum evento encontrado no Supabase');
          this.eventos = [];
        }
      } catch (erro) {
        console.error('❌ Erro ao carregar eventos:', erro);
        // Manter eventos vazios ou usar fallback mínimo
        if (!this.eventos || this.eventos.length === 0) {
          this.eventos = [];
        }
      }
    },
    
    formatarData(dataString) {
      const data = new Date(dataString + 'T00:00:00');
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      });
    }
  };
}

// Função auxiliar para abrir Google Maps
function abrirGoogleMaps() {
  const dados = window.localizacaoIgrejaData;
  if (dados && dados.localizacao && dados.localizacao.googleMapsUrl) {
    const url = dados.localizacao.googleMapsUrl;
    // Se a URL não começar com http, adicionar
    const urlCompleta = url.startsWith('http') ? url : `https://${url}`;
    window.open(urlCompleta, '_blank');
  } else {
    // Fallback: construir URL do Google Maps com endereço
    if (dados && dados.endereco) {
      const endereco = `${dados.endereco.logradouro}, ${dados.endereco.numero}, ${dados.endereco.bairro}, ${dados.endereco.cidade}, ${dados.endereco.estado}`;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
      window.open(url, '_blank');
    } else {
      console.error('Dados de localização não disponíveis');
    }
  }
}

// Formulário Contato
function formularioContato() {
  return {
    dados: {
      nome: '',
      email: '',
      telefone: '',
      assunto: '',
      mensagem: ''
    },
    enviando: false,
    mensagemSucesso: false,
    mensagemErro: '',
    
    async enviar() {
      // Validação básica
      if (!this.dados.nome || !this.dados.email || !this.dados.assunto || !this.dados.mensagem) {
        this.mensagemErro = 'Por favor, preencha todos os campos obrigatórios.';
        return;
      }
      
      this.enviando = true;
      this.mensagemErro = '';
      
      try {
        console.log('📧 Enviando email via EmailJS:', this.dados);
        const resultado = await enviarEmail(this.dados);
        
        if (resultado.sucesso) {
          this.mensagemSucesso = true;
          this.mensagemErro = '';
          
          // Limpar formulário após sucesso
          setTimeout(() => {
            this.dados = {
              nome: '',
              email: '',
              telefone: '',
              assunto: '',
              mensagem: ''
            };
            this.mensagemSucesso = false;
          }, 3000);
        } else {
          this.mensagemErro = `Erro: ${resultado.erro}`;
          console.error('❌ Falha no envio:', resultado.erro);
        }
      } catch (erro) {
        this.mensagemErro = 'Erro inesperado. Tente novamente.';
        console.error('❌ Erro no formulário:', erro);
      } finally {
        this.enviando = false;
      }
    }
  };
}

// Notícias IPB
function noticiasIPB() {
  return {
    noticias: [],
    carregando: true,
    
    init() {
      this.carregarNoticias();
    },
    
    async carregarNoticias() {
      this.carregando = true;
      try {
        const noticiasAPI = await buscarNoticiasIPB();
        this.noticias = noticiasAPI;
      } catch (erro) {
        console.error('Erro ao carregar notícias:', erro);
      } finally {
        this.carregando = false;
      }
    },
    
    formatarData(dataString) {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      });
    }
  };
}

// Contribuições
function contribuicoesIgreja() {
  return {
    dados: {},
    
    async init() {
      try {
        // Carregar dados bancários do Supabase
        if (window.supabaseClient) {
          const dadosBancarios = await window.supabaseClient.listar('dados_bancarios', {
            filtro: { campo: 'ativo', operador: 'eq', valor: true }
          });
          
          if (dadosBancarios && dadosBancarios.length > 0) {
            const dadoAtivo = dadosBancarios[0]; // Pegar o primeiro ativo
            this.dados = {
              qrcode: {
                imagemUrl: dadoAtivo.qrcode_url || '',
                instrucoes: dadoAtivo.qrcode_instrucoes || ''
              },
              contaBancaria: {
                favorecido: dadoAtivo.favorecido || '',
                cnpj: dadoAtivo.cnpj || '',
                banco: {
                  nome: dadoAtivo.banco_nome || '',
                  codigo: dadoAtivo.banco_codigo || ''
                },
                agencia: dadoAtivo.agencia || '',
                conta: dadoAtivo.conta || ''
              },
              pix: {
                tipo: dadoAtivo.pix_tipo || '',
                chave: dadoAtivo.pix_chave || ''
              },
              informacoes: {
                mensagem: dadoAtivo.informacoes_mensagem || ''
              }
            };
            console.log('✅ Dados bancários carregados do Supabase');
          }
        } else {
          // Fallback para JSON
          const dadosBancarios = await dataManager.carregarDadosBancarios();
          if (dadosBancarios) {
            this.dados = dadosBancarios;
            console.log('✅ Dados bancários carregados do JSON (fallback)');
          }
        }
      } catch (erro) {
        console.error('Erro ao carregar dados bancários:', erro);
        // Fallback para JSON em caso de erro
        try {
          const dadosBancarios = await dataManager.carregarDadosBancarios();
          if (dadosBancarios) {
            this.dados = dadosBancarios;
          }
        } catch (e) {
          console.error('Erro no fallback:', e);
        }
      }
    },
    
    async copiarChavePix() {
      const chavePix = this.dados?.pix?.chave || '00.000.000/0001-00';
      
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(chavePix);
          alert('Chave PIX copiada para a área de transferência!');
        } else {
          alert('Chave PIX: ' + chavePix);
        }
      } catch (erro) {
        console.error('Erro ao copiar PIX:', erro);
        alert('Chave PIX: ' + chavePix);
      }
    }
  };
}

// Localização da Igreja
function localizacaoIgreja() {
  return {
    dados: {},
    
    async init() {
      try {
        // Carregar dados da igreja do Supabase
        if (window.supabaseClient) {
          const dado = await window.supabaseClient.getDadosIgreja();
          
          if (dado) {
            this.dados = {
              endereco: {
                logradouro: dado.logradouro || '',
                numero: dado.numero || '',
                complemento: dado.complemento || '',
                bairro: dado.bairro || '',
                cidade: dado.cidade || '',
                estado: dado.estado || '',
                cep: dado.cep || ''
              },
              contato: {
                telefone: dado.telefone || '',
                whatsapp: dado.whatsapp || '',
                email: dado.email || '',
                emailSecretaria: dado.email_secretaria || ''
              },
              localizacao: {
                latitude: dado.latitude || null,
                longitude: dado.longitude || null,
                googleMapsEmbed: dado.google_maps_embed || '',
                googleMapsUrl: dado.google_maps_url || '',
                wazeUrl: dado.waze_url || '',
                uberUrl: dado.uber_url || ''
              },
              horarios: {
                cultos: [
                  {
                    dia: 'Sexta-feira',
                    horario: dado.culto_sexta_horario || '',
                    tipo: 'Culto de Oração'
                  },
                  {
                    dia: 'Domingo',
                    horario: dado.culto_domingo_horario || '',
                    tipo: 'Culto de Celebração'
                  }
                ],
                secretaria: {
                  dias: dado.secretaria_dias || '',
                  horario: dado.secretaria_horario || ''
                },
                atendimentoPastoral: {
                  disponibilidade: dado.atendimento_pastoral || '',
                  telefone: dado.atendimento_pastoral_telefone || ''
                }
              },
              lideranca: {
                pastor: {
                  nome: dado.pastor_nome || '',
                  titulo: dado.pastor_titulo || '',
                  instagram: dado.pastor_instagram || '',
                  instagramUrl: dado.pastor_instagram_url || '',
                  email: dado.pastor_email || ''
                }
              }
            };
            // Expor dados globalmente para função auxiliar
            window.localizacaoIgrejaData = this.dados;
            console.log('✅ Dados da igreja carregados do Supabase');
          }
        } else {
          // Fallback para JSON
          const dadosIgreja = await dataManager.carregarDadosIgreja();
          if (dadosIgreja) {
            this.dados = dadosIgreja;
            window.localizacaoIgrejaData = this.dados;
            console.log('✅ Dados da igreja carregados do JSON (fallback)');
          }
        }
      } catch (erro) {
        console.error('Erro ao carregar dados da igreja:', erro);
        // Fallback para JSON em caso de erro
        try {
          const dadosIgreja = await dataManager.carregarDadosIgreja();
          if (dadosIgreja) {
            this.dados = dadosIgreja;
            window.localizacaoIgrejaData = this.dados;
          }
        } catch (e) {
          console.error('Erro no fallback:', e);
        }
      }
    },
    
    abrirGoogleMaps() {
      if (this.dados && this.dados.localizacao && this.dados.localizacao.googleMapsUrl) {
        const url = this.dados.localizacao.googleMapsUrl;
        // Se a URL não começar com http, adicionar
        const urlCompleta = url.startsWith('http') ? url : `https://${url}`;
        window.open(urlCompleta, '_blank');
      } else if (this.dados && this.dados.endereco) {
        // Fallback: construir URL do Google Maps com endereço
        const endereco = `${this.dados.endereco.logradouro}, ${this.dados.endereco.numero}, ${this.dados.endereco.bairro}, ${this.dados.endereco.cidade}, ${this.dados.endereco.estado}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
        window.open(url, '_blank');
      } else {
        console.error('Dados de localização não disponíveis');
        alert('Endereço não disponível');
      }
    }
  };
}

// Modal Visitante
function modalVisitante() {
  return {
    modalAberto: false,
    salvando: false,
    mensagemSucesso: false,
    visitante: {
      nome: '',
      dataVisita: '',
      telefone: '',
      mensagem: ''
    },
    dataMinima: '',
    
    init() {
      console.log('🎯 Modal Visitante inicializado!');
      // Define data mínima como hoje
      const hoje = new Date();
      this.dataMinima = hoje.toISOString().split('T')[0];
    },
    
    abrirModal() {
      console.log('🚀 Abrindo modal visitante...');
      this.modalAberto = true;
      this.mensagemSucesso = false;
      // Limpar formulário
      this.visitante = {
        nome: '',
        dataVisita: '',
        telefone: '',
        mensagem: ''
      };
    },
    
    fecharModal() {
      this.modalAberto = false;
    },
    
    async salvarVisitante() {
      if (!this.visitante.nome || !this.visitante.dataVisita) {
        alert('Nome e data da visita são obrigatórios');
        return;
      }

      this.salvando = true;
      
      try {
        // Preparar dados para o Supabase
        const dadosVisitante = {
          nome: this.visitante.nome,
          data_visita: this.visitante.dataVisita, // Campo no banco é data_visita
          telefone: this.visitante.telefone || null,
          mensagem: this.visitante.mensagem || null,
          status: 'confirmado' // Minúsculo conforme constraint do banco
        };
        
        // Salvar no Supabase
        if (window.supabaseClient) {
          const visitanteSalvo = await window.supabaseClient.criar('visitantes', dadosVisitante);
          
          if (visitanteSalvo) {
            console.log('✅ Visitante salvo no Supabase:', visitanteSalvo);
            this.mensagemSucesso = true;
            
            // Limpar formulário
            this.visitante = {
              nome: '',
              dataVisita: '',
              telefone: '',
              mensagem: ''
            };
            
            setTimeout(() => {
              this.fecharModal();
              this.mensagemSucesso = false;
            }, 3000);
          } else {
            throw new Error('Falha ao salvar visitante no Supabase');
          }
        } else {
          // Fallback para localStorage se Supabase não estiver disponível
          const novoVisitante = {
            id: Date.now(),
            nome: this.visitante.nome,
            dataVisita: this.visitante.dataVisita,
            telefone: this.visitante.telefone || '',
            mensagem: this.visitante.mensagem || '',
            dataCadastro: new Date().toISOString(),
            status: 'confirmado'
          };
          
          let visitantesLocal = JSON.parse(localStorage.getItem('ipv_visitantes') || '[]');
          visitantesLocal.push(novoVisitante);
          localStorage.setItem('ipv_visitantes', JSON.stringify(visitantesLocal));
          
          console.log('✅ Visitante salvo no localStorage (fallback):', novoVisitante);
          this.mensagemSucesso = true;
          
          this.visitante = {
            nome: '',
            dataVisita: '',
            telefone: '',
            mensagem: ''
          };
          
          setTimeout(() => {
            this.fecharModal();
            this.mensagemSucesso = false;
          }, 3000);
        }
        
      } catch (erro) {
        console.error('❌ Erro ao salvar visitante:', erro);
        alert('Erro ao salvar visitante: ' + (erro.message || 'Tente novamente.'));
      } finally {
        this.salvando = false;
      }
    },
    
    formatarData(dataString) {
      if (!dataString) return '';
      const data = new Date(dataString + 'T00:00:00');
      return data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long',
        year: 'numeric'
      });
    }
  };
}

// Copiar PIX
async function copiarPix() {
  try {
    const dadosBancarios = await dataManager.carregarDadosBancarios();
    const chavePix = dadosBancarios?.pix?.chave || '00.000.000/0001-00';
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(chavePix).then(() => {
        alert('Chave PIX copiada para a área de transferência!');
      });
    } else {
      alert('Chave PIX: ' + chavePix);
    }
  } catch (erro) {
    console.error('Erro ao copiar PIX:', erro);
    alert('Erro ao copiar chave PIX');
  }
}

// Sistema de Autenticação da Navbar
function authNavbar() {
  return {
    estaLogado: false,
    usuario: null,
    saudacao: 'Olá visitante!',
    dropdownAberto: false,
    
    async init() {
      // Verificar sessão imediatamente
      await this.verificarSessao();
      
      // Escutar evento de sessão salva (quando login acontece)
      window.addEventListener('sessaoSalva', (event) => {
        console.log('📢 Evento sessaoSalva recebido:', event.detail);
        if (event.detail && event.detail.usuario) {
          this.estaLogado = true;
          this.usuario = {
            id: event.detail.usuario.id,
            email: event.detail.usuario.email,
            nome: event.detail.usuario.nome,
            sobrenome: event.detail.usuario.sobrenome || '',
            tipo: event.detail.usuario.tipo,
            status: event.detail.usuario.status,
            avatar: event.detail.usuario.avatar || `https://ui-avatars.com/api/?name=${event.detail.usuario.nome}&background=1A4731&color=fff&size=128`,
            permissoes: event.detail.usuario.permissoes || []
          };
          this.atualizarSaudacao();
          console.log('✅ Navbar atualizada após sessão salva');
        }
      });
      
      // Verificar novamente após 1 segundo (para garantir que Supabase carregou)
      setTimeout(async () => {
        await this.verificarSessao();
      }, 1000);
      
      // Verificar novamente após 2 segundos (para casos de redirecionamento)
      setTimeout(async () => {
        await this.verificarSessao();
      }, 2000);
      
      // Debug: Verificar estado inicial
      console.log('🔍 AuthNavbar iniciado - Estado:', {
        estaLogado: this.estaLogado,
        usuario: this.usuario,
        saudacao: this.saudacao
      });
    },
    
    toggleDropdown() {
      this.dropdownAberto = !this.dropdownAberto;
    },
    
    fecharDropdown() {
      this.dropdownAberto = false;
    },
    
    async verificarSessao() {
      // PRIORIDADE 1: Verificar sessão do Supabase diretamente
      if (window.supabaseClient && window.supabaseClient.client) {
        try {
          const { data: { session }, error } = await window.supabaseClient.client.auth.getSession();
          
          if (session && !error && session.user) {
            // Buscar perfil do usuário
            const usuario = await window.supabaseClient.buscarUsuarioPorAuthId(session.user.id);
            
            if (usuario) {
              // Salvar no auth.js também
              if (window.auth) {
                window.auth.salvarSessaoSupabase(usuario, session);
              }
              
              this.estaLogado = true;
              this.usuario = {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome || '',
                tipo: usuario.tipo,
                status: usuario.status,
                avatar: usuario.avatar_url || `https://ui-avatars.com/api/?name=${usuario.nome}&background=1A4731&color=fff&size=128`,
                permissoes: usuario.permissoes || []
              };
              this.atualizarSaudacao();
              console.log('✅ Sessão Supabase ativa na navbar:', usuario.nome);
              return;
            }
          }
        } catch (erro) {
          console.log('Erro ao verificar Supabase na navbar:', erro);
        }
      }
      
      // PRIORIDADE 2: Verificar sistema auth.js principal
      if (window.auth && auth.verificarSessaoAtiva()) {
        this.estaLogado = true;
        this.usuario = auth.usuario;
        this.atualizarSaudacao();
        console.log('✅ Sessão ativa via auth.js:', this.usuario.nome);
        return;
      }
      
      // FALLBACK: Verificar se existe uma sessão ativa no formato antigo
      const sessao = localStorage.getItem('ipv_sessao');
      if (sessao) {
        try {
          const dadosSessao = JSON.parse(sessao);
          const agora = new Date().getTime();
          
          // Verificar se a sessão não expirou (24 horas)
          if (dadosSessao.expiresAt && agora < dadosSessao.expiresAt) {
            this.estaLogado = true;
            this.usuario = dadosSessao.usuario;
            this.atualizarSaudacao();
            console.log('✅ Sessão ativa encontrada (fallback):', this.usuario.nome);
            return;
          } else {
            // Sessão expirada
            localStorage.removeItem('ipv_sessao');
          }
        } catch (erro) {
          console.error('Erro ao verificar sessão:', erro);
          localStorage.removeItem('ipv_sessao');
        }
      }
      
      // Se não há sessão ou expirou
      this.estaLogado = false;
      this.usuario = null;
      this.saudacao = 'Olá visitante!';
    },
    
    atualizarSaudacao() {
      if (this.usuario) {
        const nome = this.usuario.nome;
        if (this.usuario.tipo === 'administracao') {
          this.saudacao = `Olá ${nome}!`;
        } else if (this.usuario.tipo === 'lideranca') {
          this.saudacao = `Olá ${nome}!`;
        } else {
          this.saudacao = `Olá ${nome}!`;
        }
      } else {
        this.saudacao = 'Olá visitante!';
      }
    },
    
    logout() {
      // Usar o sistema auth.js principal se disponível
      if (window.auth && typeof auth.logout === 'function') {
        auth.logout();
        return;
      }
      
      // FALLBACK: Remover sessão manualmente
      localStorage.removeItem('ipv_sessao');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      localStorage.removeItem('auth_expires');
      
      // Resetar estado
      this.estaLogado = false;
      this.usuario = null;
      this.saudacao = 'Olá visitante!';
      
      // Redirecionar para a página inicial usando CONFIG
      const homeUrl = window.CONFIG ? window.CONFIG.buildUrl('index.html') : 'index.html';
      window.location.href = homeUrl;
      
      console.log('👋 Logout realizado com sucesso');
    },
    
    scrollToSection(sectionId) {
      const elemento = document.querySelector(`#${sectionId}`);
      if (elemento) {
        const offsetTop = elemento.offsetTop - 70;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    },
    
    irParaLogin() {
      console.log('🚀 Navegando para página de login...');
      // Usar CONFIG para construir URL correta em dev e produção
      const loginUrl = window.CONFIG 
        ? window.CONFIG.buildPageUrl('login.html') + '?force=true'
        : 'pagina/login.html?force=true';
      window.location.href = loginUrl;
    },
    
    irParaAdmin() {
      console.log('🚀 Tentando acessar área administrativa...');
      
      // Usar CONFIG para construir URL correta em dev e produção
      const adminUrl = window.CONFIG 
        ? window.CONFIG.buildPageUrl('admin.html')
        : 'pagina/admin.html';
      
      // Verificar se há sistema de autenticação ativo
      if (window.auth && typeof auth.ehAdmin === 'function') {
        if (auth.ehAdmin()) {
          console.log('✅ Admin confirmado - navegando para admin.html');
          window.location.href = adminUrl;
        } else {
          console.log('🚫 Usuário não é admin');
          alert('🚫 Acesso negado! Área restrita para administradores.');
        }
      } else {
        // Fallback: verificar pelo objeto usuario diretamente
        if (this.usuario && this.usuario.tipo === 'administracao') {
          console.log('✅ Admin confirmado (fallback) - navegando para admin.html');
          window.location.href = adminUrl;
        } else {
          console.log('🚫 Usuário não é admin (fallback)');
          alert('🚫 Acesso negado! Área restrita para administradores.');
        }
      }
    }
  };
}

// ============================================
// FUNÇÃO PARA BAIXAR MÍDIAS
// ============================================

async function baixarMidias() {
  console.log('📥 Iniciando download de mídias...');
  
  try {
    // Carregar lista de mídias do JSON
    const response = await fetch('data/midias.json');
    const dados = await response.json();
    const midias = dados.midias;
    
    console.log(`📂 ${midias.length} mídias encontradas`);
    
    // Mostrar modal com as opções de download
    mostrarModalMidias(midias, dados.instrucoes);
    
  } catch (erro) {
    console.error('❌ Erro ao carregar mídias:', erro);
    alert('❌ Erro ao carregar lista de mídias. Tente novamente.');
  }
}

// Função para mostrar modal com links de download
function mostrarModalMidias(midias, instrucoes) {
  // Criar modal dinamicamente
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    animation: fadeIn 0.3s;
  `;
  
  const conteudo = document.createElement('div');
  conteudo.style.cssText = `
    background: white;
    border-radius: 15px;
    padding: 30px;
    max-width: 700px;
    max-height: 85vh;
    overflow-y: auto;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    animation: slideUp 0.3s;
  `;
  
  let html = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #1A4731; display: flex; align-items: center; gap: 10px;">
        <i class="bi bi-images" style="font-size: 1.8rem;"></i>
        <span>Mídias IPV</span>
      </h2>
      <button onclick="this.closest('[data-modal-midias]').remove()" style="
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    
    <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #2D7A3E;">
      <p style="margin: 0; color: #1A4731; font-size: 0.9rem;">
        <i class="bi bi-info-circle" style="margin-right: 5px;"></i>
        <strong>Instruções de Uso:</strong>
      </p>
      <p style="margin: 10px 0 0 0; color: #2D7A3E; font-size: 0.85rem; line-height: 1.5;">
        ${instrucoes?.uso || 'Clique nos itens abaixo para baixar as mídias individualmente.'}
      </p>
    </div>
    
    <div style="margin-bottom: 15px;">
      <h3 style="font-size: 0.95rem; color: #666; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        Arquivos Disponíveis (${midias.length})
      </h3>
    </div>
    
    <div style="display: grid; gap: 12px;">
  `;
  
  midias.forEach(midia => {
    const nomeArquivo = midia.arquivo.split('/').pop();
    const icone = midia.tipo === 'imagem' ? 'file-earmark-image' : 'file-earmark';
    
    html += `
      <a href="${midia.arquivo}" download="${nomeArquivo}" style="
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 18px;
        background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
        border-radius: 10px;
        text-decoration: none;
        color: #1A4731;
        transition: all 0.3s;
        border: 2px solid transparent;
      " onmouseover="
        this.style.background='linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
        this.style.borderColor='#2D7A3E';
        this.style.transform='translateY(-2px)';
        this.style.boxShadow='0 5px 15px rgba(45,122,62,0.2)';
      " onmouseout="
        this.style.background='linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)';
        this.style.borderColor='transparent';
        this.style.transform='translateY(0)';
        this.style.boxShadow='none';
      ">
        ${midia.tipo === 'imagem' ? `
          <div style="
            width: 70px;
            height: 70px;
            border-radius: 10px;
            overflow: hidden;
            flex-shrink: 0;
            border: 2px solid #e0e0e0;
          ">
            <img src="${midia.arquivo}" alt="${midia.nome}" style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            ">
          </div>
        ` : `
          <div style="
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #2D7A3E, #1A4731);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <i class="bi bi-${icone}" style="font-size: 1.8rem; color: white;"></i>
          </div>
        `}
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; color: #1A4731; margin-bottom: 3px;">${midia.nome}</div>
          <div style="font-size: 0.85rem; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${midia.descricao}
          </div>
          ${midia.tamanho ? `<div style="font-size: 0.75rem; color: #999; margin-top: 2px;">${midia.tamanho}</div>` : ''}
        </div>
        <div style="flex-shrink: 0;">
          <i class="bi bi-download" style="font-size: 1.2rem; color: #2D7A3E;"></i>
        </div>
      </a>
    `;
  });
  
  html += `
    </div>
    
    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <button onclick="baixarTodasMidias(${JSON.stringify(midias).replace(/"/g, '&quot;')})" style="
        width: 100%;
        padding: 15px;
        background: linear-gradient(135deg, #2D7A3E, #1A4731);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.3s;
      " onmouseover="
        this.style.background='linear-gradient(135deg, #1A4731, #0d2318)';
        this.style.transform='translateY(-2px)';
        this.style.boxShadow='0 5px 20px rgba(26,71,49,0.4)';
      " onmouseout="
        this.style.background='linear-gradient(135deg, #2D7A3E, #1A4731)';
        this.style.transform='translateY(0)';
        this.style.boxShadow='none';
      ">
        <i class="bi bi-cloud-download" style="font-size: 1.3rem;"></i>
        <span>Baixar Todas as Mídias</span>
      </button>
      
      <p style="text-align: center; margin: 15px 0 0 0; font-size: 0.8rem; color: #999;">
        ${instrucoes?.licenca || ''}
      </p>
    </div>
  `;
  
  conteudo.innerHTML = html;
  modal.appendChild(conteudo);
  modal.setAttribute('data-modal-midias', 'true');
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  document.body.appendChild(modal);
}

// Função para baixar todas as mídias de uma vez (abre em novas abas)
function baixarTodasMidias(midias) {
  console.log('📥 Baixando todas as mídias...');
  
  let contador = 0;
  midias.forEach((midia, index) => {
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = midia.arquivo;
      link.download = midia.arquivo.split('/').pop();
      link.click();
      contador++;
      
      if (contador === midias.length) {
        console.log('✅ Download de todas as mídias iniciado!');
      }
    }, index * 300); // Delay de 300ms entre cada download
  });
  
  alert(`✅ Download de ${midias.length} mídias iniciado!\nOs arquivos serão baixados automaticamente.`);
}
