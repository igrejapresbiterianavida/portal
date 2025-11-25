// ============================================
// API-INTEGRACAO.JS - Integrações Externas
// ============================================

// Buscar vídeos do canal via RSS Feed (SEM API KEY - Alternativa)
async function buscarVideosYouTubeRSS(canalId) {
  try {
    if (!canalId) {
      console.warn('⚠️ Canal ID não fornecido');
      return [];
    }
    
    // YouTube RSS Feed - Público, não precisa de API key
    // Formato: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
    // Usar proxy CORS para evitar bloqueio
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${canalId}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
    
    console.log('📡 Buscando vídeos via RSS Feed do YouTube...');
    console.log('🔗 URL:', rssUrl);
    
    // Fazer requisição ao RSS via proxy CORS
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar RSS:', response.status);
      return [];
    }
    
    // Se usar proxy, extrair o conteúdo
    const data = await response.json();
    const xmlText = data.contents || await response.text();
    
    // Parsear XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Verificar se há erros no parsing
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('❌ Erro ao parsear XML:', parseError.textContent);
      return [];
    }
    
    // Extrair vídeos do RSS
    const entries = xmlDoc.querySelectorAll('entry');
    const videos = [];
    
    entries.forEach((entry, index) => {
      try {
        // Extrair dados do RSS
        const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent || 
                       entry.querySelector('id')?.textContent?.split(':').pop() || '';
        
        const titulo = entry.querySelector('title')?.textContent || '';
        const descricao = entry.querySelector('media\\:description, description')?.textContent || '';
        const thumbnail = entry.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url') || 
                         `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const published = entry.querySelector('published')?.textContent || '';
        const author = entry.querySelector('author name')?.textContent || '';
        
        // Extrair duração se disponível (pode não estar no RSS)
        const duration = entry.querySelector('yt\\:duration, duration')?.getAttribute('seconds') || null;
        
        if (videoId && titulo) {
          videos.push({
            id: videoId,
            video_id: videoId,
            titulo: titulo.trim(),
            descricao: descricao.trim().substring(0, 200) + (descricao.trim().length > 200 ? '...' : ''),
            thumbnail: thumbnail,
            thumbnail_url: thumbnail,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            dataPublicacao: published,
            data_publicacao: published,
            duracao: duration ? formatarDuracao(duration) : null,
            visualizacoes: 0, // RSS não fornece visualizações
            origem: 'youtube-rss',
            autor: author
          });
        }
      } catch (erro) {
        console.warn(`⚠️ Erro ao processar vídeo ${index}:`, erro);
      }
    });
    
    console.log(`✅ ${videos.length} vídeos encontrados via RSS Feed`);
    return videos;
    
  } catch (erro) {
    console.error('❌ Erro ao buscar vídeos via RSS:', erro);
    return [];
  }
}

// Formatar duração de segundos para HH:MM:SS ou MM:SS
function formatarDuracao(segundos) {
  if (!segundos) return null;
  
  const totalSegundos = parseInt(segundos);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segs = totalSegundos % 60;
  
  if (horas > 0) {
    return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  } else {
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }
}

// Buscar detalhes adicionais do vídeo via oEmbed (título, thumbnail, etc)
async function buscarDetalhesVideoYouTube(videoId) {
  try {
    // YouTube oEmbed API - Público, não precisa de API key
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      titulo: data.title || '',
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      autor: data.author_name || '',
      altura: data.height || 360,
      largura: data.width || 480
    };
  } catch (erro) {
    console.warn(`⚠️ Erro ao buscar detalhes do vídeo ${videoId}:`, erro);
    return null;
  }
}

// Buscar TODOS os vídeos do canal (via RSS Feed - SEM API KEY)
async function buscarTodosVideosYouTube() {
  try {
    const canalId = CONFIG.CANAL_ID;
    
    if (!canalId) {
      console.warn('⚠️ Canal ID não configurado');
      return [];
    }
    
    console.log('🔍 Buscando vídeos do canal YouTube via RSS Feed (sem API key)...');
    
    // Usar RSS Feed do YouTube (público, não precisa de API key)
    const videos = await buscarVideosYouTubeRSS(canalId);
    
    if (videos.length > 0) {
      console.log(`✅ ${videos.length} vídeos carregados via RSS Feed`);
      
      // Opcional: Buscar detalhes adicionais via oEmbed para os primeiros vídeos
      // (limitado para não fazer muitas requisições)
      const videosComDetalhes = await Promise.all(
        videos.slice(0, 10).map(async (video) => {
          try {
            const detalhes = await buscarDetalhesVideoYouTube(video.video_id);
            if (detalhes) {
              return {
                ...video,
                titulo: detalhes.titulo || video.titulo,
                thumbnail: detalhes.thumbnail || video.thumbnail
              };
            }
            return video;
          } catch (erro) {
            return video;
          }
        })
      );
      
      // Combinar vídeos com detalhes + vídeos sem detalhes
      const todosVideos = [
        ...videosComDetalhes,
        ...videos.slice(10)
      ];
      
      return todosVideos;
    }
    
    return [];
    
  } catch (erro) {
    console.error('❌ Erro ao buscar vídeos do YouTube:', erro);
    return [];
  }
}

// Buscar vídeos do canal (versão limitada - usando RSS Feed)
async function buscarVideosYouTube(maxResults = 6) {
  try {
    const canalId = CONFIG.CANAL_ID;
    
    if (!canalId) {
      console.warn('⚠️ Canal ID não configurado');
      return [];
    }
    
    // Usar RSS Feed e limitar resultados
    const videos = await buscarVideosYouTubeRSS(canalId);
    return videos.slice(0, maxResults);
  } catch (erro) {
    console.error('❌ Erro ao buscar vídeos do YouTube:', erro);
    return [];
  }
}

// Verificar se há transmissão ao vivo (via RSS Feed)
async function verificarLiveYouTube() {
  try {
    const canalId = CONFIG.CANAL_ID;
    
    if (!canalId) {
      return { aoVivo: false };
    }
    
    console.log('🔍 Verificando se há transmissão ao vivo...');
    
    // Buscar vídeos recentes via RSS (apenas os 5 mais recentes)
    const videos = await buscarVideosYouTubeRSS(canalId);
    
    if (!videos || videos.length === 0) {
      return { aoVivo: false };
    }
    
    // Pegar o vídeo mais recente
    const videoMaisRecente = videos[0];
    
    if (!videoMaisRecente || !videoMaisRecente.video_id) {
      return { aoVivo: false };
    }
    
    // Verificar se é uma live usando oEmbed (YouTube indica se é live)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoMaisRecente.video_id}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        // Verificar se o título ou descrição indica que é live
        // YouTube geralmente adiciona indicadores de live no título
        const titulo = data.title || videoMaisRecente.titulo || '';
        const isLive = titulo.toLowerCase().includes('ao vivo') || 
                      titulo.toLowerCase().includes('live') ||
                      titulo.toLowerCase().includes('🔴') ||
                      titulo.toLowerCase().includes('streaming');
        
        // Verificar também se foi publicado há menos de 2 horas (pode ser live recente)
        const dataPublicacao = new Date(videoMaisRecente.dataPublicacao || videoMaisRecente.data_publicacao);
        const agora = new Date();
        const diferencaHoras = (agora - dataPublicacao) / (1000 * 60 * 60);
        
        // Se foi publicado há menos de 2 horas e tem indicadores de live
        if (isLive || (diferencaHoras < 2 && titulo.toLowerCase().includes('culto'))) {
          console.log('🔴 Live detectado!', videoMaisRecente.titulo);
          return {
            aoVivo: true,
            videoId: videoMaisRecente.video_id,
            titulo: videoMaisRecente.titulo,
            thumbnail: videoMaisRecente.thumbnail || videoMaisRecente.thumbnail_url,
            url: videoMaisRecente.url || `https://www.youtube.com/watch?v=${videoMaisRecente.video_id}`,
            embedUrl: `https://www.youtube.com/embed/${videoMaisRecente.video_id}?autoplay=1`
          };
        }
      }
    } catch (erro) {
      console.warn('⚠️ Erro ao verificar live via oEmbed:', erro);
    }
    
    // Fallback: verificar se o vídeo mais recente foi publicado há menos de 30 minutos
    // (pode indicar que está ao vivo agora)
    const dataPublicacao = new Date(videoMaisRecente.dataPublicacao || videoMaisRecente.data_publicacao);
    const agora = new Date();
    const diferencaMinutos = (agora - dataPublicacao) / (1000 * 60);
    
    if (diferencaMinutos < 30) {
      // Verificar se o título tem indicadores de live
      const titulo = videoMaisRecente.titulo || '';
      if (titulo.toLowerCase().includes('ao vivo') || 
          titulo.toLowerCase().includes('live') ||
          titulo.toLowerCase().includes('🔴') ||
          titulo.toLowerCase().includes('streaming') ||
          titulo.toLowerCase().includes('culto')) {
        console.log('🔴 Live detectado (vídeo recente)!', videoMaisRecente.titulo);
        return {
          aoVivo: true,
          videoId: videoMaisRecente.video_id,
          titulo: videoMaisRecente.titulo,
          thumbnail: videoMaisRecente.thumbnail || videoMaisRecente.thumbnail_url,
          url: videoMaisRecente.url || `https://www.youtube.com/watch?v=${videoMaisRecente.video_id}`,
          embedUrl: `https://www.youtube.com/embed/${videoMaisRecente.video_id}?autoplay=1`
        };
      }
    }
    
    return { aoVivo: false };
  } catch (erro) {
    console.error('Erro ao verificar live:', erro);
    return { aoVivo: false };
  }
}

// Exportar para uso global
window.buscarVideosYouTube = buscarVideosYouTube;
window.buscarTodosVideosYouTube = buscarTodosVideosYouTube;
window.buscarVideosYouTubeRSS = buscarVideosYouTubeRSS;
window.buscarDetalhesVideoYouTube = buscarDetalhesVideoYouTube;
window.verificarLiveYouTube = verificarLiveYouTube;

// Buscar notícias da IPB (via Edge Function - resolve CORS)
async function buscarNoticiasIPB() {
  try {
    // Usar Edge Function do Supabase para evitar CORS
    if (window.supabaseClient && window.supabaseClient.url) {
      const functionUrl = `${window.supabaseClient.url}/functions/v1/buscar-noticias-ipb`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.supabaseClient.anonKey || ''}`,
          'apikey': window.supabaseClient.anonKey || ''
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`✅ ${result.data.length} notícias IPB carregadas via Edge Function`);
        return result.data;
      }
    }
    
    // Fallback: dados mockados se Edge Function não disponível
    console.warn('⚠️ Edge Function não disponível, usando dados mockados');
    return [
      {
        id: '1',
        titulo: 'Sínodo da Igreja Presbiteriana do Brasil realiza encontro anual',
        descricao: 'Líderes presbiterianos de todo o país se reúnem para discutir o futuro da denominação.',
        dataPublicacao: new Date().toISOString().split('T')[0],
        categoria: 'Institucional',
        link: 'https://ipb.org.br',
        imagem: 'assets/images/logo-verde.svg'
      },
      {
        id: '2',
        titulo: 'Missões IPB anuncia novo campo missionário',
        descricao: 'Igreja envia missionários para iniciar trabalho de evangelização.',
        dataPublicacao: new Date().toISOString().split('T')[0],
        categoria: 'Missões',
        link: 'https://ipb.org.br',
        imagem: 'assets/images/logo-verde.svg'
      }
    ];
  } catch (erro) {
    console.error('❌ Erro ao buscar notícias IPB:', erro);
    
    // Retornar dados mockados em caso de erro
    return [
      {
        id: '1',
        titulo: 'Sínodo da Igreja Presbiteriana do Brasil realiza encontro anual',
        descricao: 'Líderes presbiterianos de todo o país se reúnem para discutir o futuro da denominação.',
        dataPublicacao: new Date().toISOString().split('T')[0],
        categoria: 'Institucional',
        link: 'https://ipb.org.br',
        imagem: 'assets/images/logo-verde.svg'
      }
    ];
  }
}

// ============================================
// Bible API (bible-api.com) - API Gratuita
// ============================================

// IDs dos livros para versículo aleatório (EXCLUINDO Salmos e Provérbios)
const LIVROS_VERSICULO = 'GEN,EXO,LEV,NUM,DEU,JOS,JDG,RUT,1SA,2SA,1KI,2KI,1CH,2CH,EZR,NEH,EST,JOB,ISA,JER,LAM,EZK,DAN,HOS,JOL,AMO,OBA,JON,MIC,NAH,HAB,ZEP,HAG,ZEC,MAL,MAT,MRK,LUK,JHN,ACT,ROM,1CO,2CO,GAL,EPH,PHP,COL,1TH,2TH,1TI,2TI,TIT,PHM,HEB,JAS,1PE,2PE,1JN,2JN,3JN,JUD,REV';

// Versículo do Dia - APENAS livros que NÃO sejam Salmos (PSA) ou Provérbios (PRO)
async function buscarVersiculoAleatorio() {
  try {
    const url = `${CONFIG.BIBLE_API_URL}/random/${CONFIG.LIVROS_VERSICULO}`;
    console.log('🔍 Buscando versículo em:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Resposta da API (versículo):', data);
    
    // A API retorna random_verse
    if (data && data.random_verse) {
      const verse = data.random_verse;
      return {
        texto: verse.text.trim(),
        referencia: `${verse.book} ${verse.chapter}:${verse.verse}`,
        livro: verse.book,
        capitulo: verse.chapter,
        versiculo: verse.verse
      };
    }
    
    console.warn('⚠️ API retornou dados sem versículos');
    return null;
  } catch (erro) {
    console.error('❌ Erro ao buscar versículo aleatório:', erro);
    return null;
  }
}

// Salmo do Dia - APENAS do livro de Salmos (PSA)
async function buscarSalmoAleatorio() {
  try {
    // BLOQUEIO: USA APENAS o livro de Salmos (PSA)
    const url = `${CONFIG.BIBLE_API_URL}/random/PSA`;
    console.log('🔍 Buscando salmo em:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Resposta da API (salmo):', data);
    
    // A API retorna random_verse
    if (data && data.random_verse) {
      const verse = data.random_verse;
      return {
        texto: verse.text.trim(),
        referencia: `Salmos ${verse.chapter}:${verse.verse}`,
        livro: 'Salmos',
        capitulo: verse.chapter,
        versiculo: verse.verse
      };
    }
    
    console.warn('⚠️ API retornou dados sem versículos');
    return null;
  } catch (erro) {
    console.error('❌ Erro ao buscar salmo:', erro);
    return null;
  }
}

// Provérbio do Dia - APENAS do livro de Provérbios (PRO)
async function buscarProverbioAleatorio() {
  try {
    // BLOQUEIO: USA APENAS o livro de Provérbios (PRO)
    const url = `${CONFIG.BIBLE_API_URL}/random/PRO`;
    console.log('🔍 Buscando provérbio em:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Resposta da API (provérbio):', data);
    
    // A API retorna random_verse
    if (data && data.random_verse) {
      const verse = data.random_verse;
      return {
        texto: verse.text.trim(),
        referencia: `Provérbios ${verse.chapter}:${verse.verse}`,
        livro: 'Provérbios',
        capitulo: verse.chapter,
        versiculo: verse.verse
      };
    }
    
    console.warn('⚠️ API retornou dados sem versículos');
    return null;
  } catch (erro) {
    console.error('❌ Erro ao buscar provérbio:', erro);
    return null;
  }
}

// Configurações de terceiros (usar variáveis de ambiente em produção)
async function enviarEmail(dados) {
  try {
    const serviceId = CONFIG.EMAILJS_SERVICE_ID;
    const templateId = CONFIG.EMAILJS_TEMPLATE_ID;
    const publicKey = CONFIG.EMAILJS_PUBLIC_KEY;
    
    if (!publicKey) {
      console.warn('⚠️ EmailJS não configurado');
      return { sucesso: false, erro: 'EmailJS não configurado' };
    }
    
    // Verificar se EmailJS está carregado
    if (typeof emailjs === 'undefined') {
      console.error('❌ EmailJS não carregado');
      return { sucesso: false, erro: 'EmailJS não carregado' };
    }
    
    // Inicializar EmailJS
    emailjs.init(publicKey);
    
    // Enviar email usando EmailJS
    console.log('📧 Dados sendo enviados:', {
      service: serviceId,
      template: templateId,
      publicKey: publicKey.substring(0, 5) + '...',
      destinatario: CONFIG.EMAILJS_TO_EMAIL
    });
    
    const response = await emailjs.send(serviceId, templateId, {
      // Dados principais (compatível com templates padrão)
      name: dados.nome,
      email: dados.email,
      phone: dados.telefone || 'Não informado',
      subject: dados.assunto,
      message: dados.mensagem,
      
      // Variações de nomenclatura para compatibilidade
      from_name: dados.nome,
      from_email: dados.email,
      user_name: dados.nome,
      user_email: dados.email,
      user_phone: dados.telefone || 'Não informado',
      user_subject: dados.assunto,
      user_message: dados.mensagem,
      reply_to: dados.email
    });
    
    console.log('✅ Email enviado:', response);
    
    // Verificar se foi enviado com sucesso
    if (response.status === 200) {
      return { sucesso: true, response };
    } else {
      return { sucesso: false, erro: `Status: ${response.status}` };
    }
  } catch (erro) {
    console.error('❌ Erro ao enviar email:', erro);
    
    // Melhor tratamento de erros
    let mensagemErro = 'Erro desconhecido';
    if (erro.text) {
      mensagemErro = erro.text;
    } else if (erro.message) {
      mensagemErro = erro.message;
    } else if (erro.status) {
      mensagemErro = `Erro HTTP ${erro.status}`;
    }
    
    return { sucesso: false, erro: mensagemErro };
  }
}
