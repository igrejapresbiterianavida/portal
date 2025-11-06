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
        const timestamp = new Date().getTime();
        const response = await fetch(`data/devocionais.json?v=${timestamp}`);
        const dados = await response.json();
        
        if (dados.devocionaisDiarios && dados.devocionaisDiarios.length > 0) {
          // Pega apenas os devocionais ativos
          const ativos = dados.devocionaisDiarios.filter(d => d.ativo === true);
          
          if (ativos.length > 0) {
            // Pega o primeiro ativo
            this.devocional = ativos[0];
            console.log('✅ Devocional diário carregado:', this.devocional.id);
          } else {
            console.log('⚠️ Nenhum devocional ativo encontrado');
          }
        }
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
        // Tenta buscar da API do YouTube
        const statusLive = await verificarLiveYouTube();
        this.live = statusLive;
      } catch (erro) {
        console.log('Usando dados mockados para live');
        // Fallback: você pode simular se tem live ou não
        this.live = { aoVivo: false };
      }
    },
    
    async carregarVideos() {
      this.carregando = true;
      try {
        // Primeiro tenta carregar do JSON
        const dadosJSON = await dataManager.carregarVideos();
        if (dadosJSON && dadosJSON.videos) {
          this.videos = dadosJSON.videos;
          console.log('✅ Vídeos carregados do JSON');
          this.carregando = false;
          return;
        }
        
        // Tenta buscar vídeos reais da API YouTube
        const videosAPI = await buscarVideosYouTube(6);
        
        if (videosAPI && videosAPI.length > 0) {
          this.videos = videosAPI;
          console.log('✅ Vídeos carregados da API YouTube');
        } else {
          // Fallback: Últimos 9 cultos da IPB Vida
            this.videos = [
            {
              id: 'H3vpXaanS4Y',
              titulo: 'Culto Dominical - IPB Vida',
              descricao: 'Culto de adoração e pregação da Palavra de Deus',
              thumbnail: 'https://i.ytimg.com/vi/H3vpXaanS4Y/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=H3vpXaanS4Y',
              duracao: '1:45:23',
              data: '2025-11-03'
            },
            {
              id: 'Lp5FsNQx_k8',
              titulo: 'Culto de Celebração - IPB Vida',
              descricao: 'Momento de louvor e adoração ao Senhor',
              thumbnail: 'https://i.ytimg.com/vi/Lp5FsNQx_k8/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=Lp5FsNQx_k8',
              duracao: '1:38:15',
              data: '2025-10-31'
            },
            {
              id: 'LZphVnUPJfw',
              titulo: 'Culto Vespertino - IPB Vida',
              descricao: 'Culto vespertino com pregação expositiva',
              thumbnail: 'https://i.ytimg.com/vi/LZphVnUPJfw/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=LZphVnUPJfw',
              duracao: '1:52:40',
              data: '2025-10-27'
            },
            {
              id: 'ZtA8lBgmZlA',
              titulo: 'Culto Dominical Matutino - IPB Vida',
              descricao: 'Culto matutino de domingo com a família IPB Vida',
              thumbnail: 'https://i.ytimg.com/vi/ZtA8lBgmZlA/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=ZtA8lBgmZlA',
              duracao: '1:43:55',
              data: '2025-10-24'
            },
            {
              id: 'W5tBcSnUJhU',
              titulo: 'Culto de Domingo - IPB Vida',
              descricao: 'Celebração dominical com adoração e ensino bíblico',
              thumbnail: 'https://i.ytimg.com/vi/W5tBcSnUJhU/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=W5tBcSnUJhU',
              duracao: '1:41:20',
              data: '2025-10-20'
            },
            {
              id: 'yZtjpruaTFc',
              titulo: 'Culto de Adoração - IPB Vida',
              descricao: 'Momento de adoração e reflexão na Palavra',
              thumbnail: 'https://i.ytimg.com/vi/yZtjpruaTFc/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=yZtjpruaTFc',
              duracao: '1:47:30',
              data: '2025-10-17'
            },
            {
              id: 'RrK6MACslgU',
              titulo: 'Culto Solene - IPB Vida',
              descricao: 'Culto especial de celebração e gratidão',
              thumbnail: 'https://i.ytimg.com/vi/RrK6MACslgU/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=RrK6MACslgU',
              duracao: '1:39:45',
              data: '2025-10-13'
            },
            {
              id: 'fMykvWJBB0c',
              titulo: 'Culto Dominical - Pregação da Palavra',
              descricao: 'Culto com pregação expositiva das Escrituras',
              thumbnail: 'https://i.ytimg.com/vi/fMykvWJBB0c/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=fMykvWJBB0c',
              duracao: '1:44:10',
              data: '2025-10-10'
            },
            {
              id: '32gwoMw7d0s',
              titulo: 'Culto de Louvor e Pregação',
              descricao: 'Culto com louvor congregacional e mensagem bíblica',
              thumbnail: 'https://i.ytimg.com/vi/32gwoMw7d0s/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=32gwoMw7d0s',
              duracao: '1:50:25',
              data: '2025-10-06'
            },
            {
              id: '3iTABypGsrw',
              titulo: 'Culto IPB Vida',
              descricao: 'Culto de adoração e pregação',
              thumbnail: 'https://i.ytimg.com/vi/3iTABypGsrw/hqdefault.jpg',
              url: 'https://www.youtube.com/watch?v=3iTABypGsrw',
              duracao: '10:09',
              data: '2020-07-24'
            }
            ];
          }
          } catch (erro) {
          console.error('Erro ao carregar vídeos:', erro);
          } finally {
          this.carregando = false;
          }
        },
        
        inscreverCanal() {
          window.open('https://youtube.com/@ipbvida?sub_confirmation=1', '_blank');
        },
        
        assistirAoVivo() {
          if (this.live && this.live.aoVivo) {
          window.open(this.live.url, '_blank');
          } else {
          alert('Não há transmissão ao vivo no momento. Inscreva-se para ser notificado!');
          }
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
      // Tenta carregar do JSON primeiro
      const dadosJSON = await dataManager.carregarProgramacao();
      if (dadosJSON && dadosJSON.programas) {
        this.programas = dadosJSON.programas;
        console.log('✅ Programação carregada do JSON:', this.programas);
        console.log('🖼️ Imagens dos programas:');
        this.programas.forEach((p, i) => {
          console.log(`   ${i+1}. ${p.titulo}: ${p.imagem}`);
        });
        return;
      }
      
      // Fallback: dados hardcoded
      this.programas = [
        {
          id: 1,
          titulo: 'Culto de Celebração e Adoração',
          dia: '10',
          mes: 'nov',
          horario: '19h30',
          local: 'Templo Principal',
          categoria: 'CULTOS',
          corCategoria: '#1A4731',
          link: '#',
          cor1: '#1A4731',
          cor2: '#2D5F4A',
          imagem: 'assets/images/programacao/culto.svg'
        },
        {
          id: 2,
          titulo: 'Escola Bíblica Dominical',
          dia: '10',
          mes: 'nov',
          horario: '09h00',
          local: 'Salas de Aula',
          categoria: 'ENSINO',
          corCategoria: '#2C3E50',
          link: '#',
          cor1: '#2C3E50',
          cor2: '#34495E',
          imagem: 'assets/images/programacao/ebd.svg'
        },
        {
          id: 3,
          titulo: 'Reunião de Oração',
          dia: '13',
          mes: 'nov',
          horario: '20h00',
          local: 'Templo',
          categoria: 'ORAÇÃO',
          corCategoria: '#8B3A62',
          link: '#',
          cor1: '#8B3A62',
          cor2: '#A94976',
          imagem: 'assets/images/programacao/oracao.svg'
        },
        {
          id: 4,
          titulo: 'Estudo Bíblico de Quarta',
          dia: '13',
          mes: 'nov',
          horario: '19h30',
          local: 'Salão',
          categoria: 'ESTUDO',
          corCategoria: '#D4AF37',
          link: '#',
          cor1: '#D4AF37',
          cor2: '#C9A352',
          imagem: 'assets/images/programacao/estudo.svg'
        },
        {
          id: 5,
          titulo: 'Culto de Jovens e Adolescentes',
          dia: '15',
          mes: 'nov',
          horario: '19h00',
          local: 'Salão Jovem',
          categoria: 'JOVENS',
          corCategoria: '#3498DB',
          link: '#',
          cor1: '#3498DB',
          cor2: '#5DADE2',
          imagem: 'assets/images/programacao/jovens.svg'
        },
        {
          id: 6,
          titulo: 'Ministério Infantil',
          dia: '10',
          mes: 'nov',
          horario: '10h00',
          local: 'Sala Infantil',
          categoria: 'CRIANÇAS',
          corCategoria: '#E74C3C',
          link: '#',
          cor1: '#E74C3C',
          cor2: '#EC7063',
          imagem: 'assets/images/programacao/infantil.svg'
        },
      ];
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
      // Tenta carregar do JSON primeiro
      const dadosJSON = await dataManager.carregarProgramacao();
      if (dadosJSON && dadosJSON.eventos) {
        this.eventos = dadosJSON.eventos;
        console.log('✅ Eventos carregados do JSON');
        return;
      }
      
      // Fallback: dados hardcoded
      this.eventos = [
        {
          id: 1,
          titulo: 'Culto de Celebração',
          descricao: 'Venha celebrar conosco a bondade de Deus com louvor e pregação da Palavra.',
          data: '2025-11-09',
          imagem: 'assets/images/foto-igreja.png'
        },
        {
          id: 2,
          titulo: 'Escola Bíblica Dominical',
          descricao: 'Estudo aprofundado das Escrituras para todas as idades.',
          data: '2025-11-10',
          imagem: 'assets/images/foto01.png'
        },
        {
          id: 3,
          titulo: 'Reunião de Oração',
          descricao: 'Momento de intercessão e busca pela presença de Deus.',
          data: '2025-11-08',
          imagem: 'assets/images/foto03.png'
        }
      ];
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
      const dadosBancarios = await dataManager.carregarDadosBancarios();
      if (dadosBancarios) {
        this.dados = dadosBancarios;
        console.log('✅ Dados bancários carregados do JSON');
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
      const dadosIgreja = await dataManager.carregarDadosIgreja();
      if (dadosIgreja) {
        this.dados = dadosIgreja;
        console.log('✅ Dados da igreja carregados do JSON');
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
      this.salvando = true;
      
      try {
        const novoVisitante = {
          id: Date.now(),
          nome: this.visitante.nome,
          dataVisita: this.visitante.dataVisita,
          telefone: this.visitante.telefone || '',
          mensagem: this.visitante.mensagem || '',
          dataCadastro: new Date().toISOString(),
          status: 'Confirmado'
        };
        
        let visitantesLocal = JSON.parse(localStorage.getItem('ipv_visitantes') || '[]');
        visitantesLocal.push(novoVisitante);
        localStorage.setItem('ipv_visitantes', JSON.stringify(visitantesLocal));
        
        console.log('✅ Visitante salvo:', novoVisitante);
        console.log('📊 Total:', visitantesLocal.length);
        
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
        
      } catch (erro) {
        console.error('❌ Erro:', erro);
        alert('Erro ao salvar. Tente novamente.');
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
    
    init() {
      this.verificarSessao();
      
      // Escutar evento de abertura de modal
      document.addEventListener('abrir-modal-visitante', () => {
        // A função será chamada pelo Alpine.js via $dispatch
      });
    },
    
    toggleDropdown() {
      this.dropdownAberto = !this.dropdownAberto;
    },
    
    fecharDropdown() {
      this.dropdownAberto = false;
    },
    
    verificarSessao() {
      // Verificar se existe uma sessão ativa
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
            console.log('✅ Sessão ativa encontrada:', this.usuario.nome);
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
      // Remover sessão
      localStorage.removeItem('ipv_sessao');
      
      // Resetar estado
      this.estaLogado = false;
      this.usuario = null;
      this.saudacao = 'Olá visitante!';
      
      // Redirecionar para a página inicial
      window.location.href = 'index.html';
      
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
    }
  };
}
