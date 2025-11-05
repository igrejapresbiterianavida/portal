// ============================================
// API-INTEGRACAO.JS - Integrações Externas
// ============================================

// Buscar vídeos do canal
async function buscarVideosYouTube(maxResults = 6) {
  try {
    const apiKey = CONFIG.YOUTUBE_API_KEY;
    const canalId = CONFIG.CANAL_ID;
    
    if (!apiKey || !canalId) {
      console.warn('⚠️ Credenciais do YouTube não configuradas');
      return [];
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${canalId}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`
    );
    
    if (!response.ok) {
      throw new Error('Erro na API do YouTube');
    }
    
    const data = await response.json();
    
    return data.items.map(item => ({
      id: item.id.videoId,
      titulo: item.snippet.title,
      descricao: item.snippet.description.substring(0, 100) + '...',
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      dataPublicacao: item.snippet.publishedAt
    }));
  } catch (erro) {
    console.error('Erro ao buscar vídeos:', erro);
    return [];
  }
}

// Verificar se há transmissão ao vivo
async function verificarLiveYouTube() {
  try {
    const apiKey = CONFIG.YOUTUBE_API_KEY;
    const canalId = CONFIG.CANAL_ID;
    
    if (!apiKey || !canalId) {
      console.warn('⚠️ Credenciais do YouTube não configuradas');
      return { aoVivo: false };
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${canalId}&part=snippet&eventType=live&type=video`
    );
    
    if (!response.ok) {
      throw new Error('Erro ao verificar live');
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const live = data.items[0];
      return {
        aoVivo: true,
        videoId: live.id.videoId,
        titulo: live.snippet.title,
        thumbnail: live.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${live.id.videoId}`
      };
    }
    
    return { aoVivo: false };
  } catch (erro) {
    console.error('Erro ao verificar live:', erro);
    return { aoVivo: false };
  }
}

// Buscar notícias da IPB (via RSS ou scraping)
async function buscarNoticiasIPB() {
  try {
    // Como não há API oficial, vamos usar dados estruturados
    // Você pode substituir por um serviço de RSS-to-JSON ou backend próprio
    const response = await fetch('https://ipb.org.br/feed/rss');
    
    // Por enquanto, retornar dados mockados estruturados
    return [
      {
        id: 1,
        titulo: 'Sínodo da Igreja Presbiteriana do Brasil realiza encontro anual',
        descricao: 'Líderes presbiterianos de todo o país se reúnem para discutir o futuro da denominação.',
        dataPublicacao: '2025-11-01',
        categoria: 'Institucional',
        link: 'https://ipb.org.br/noticia/sinodo-2025',
        imagem: 'assets/images/noticia-ipb-1.jpg'
      },
      {
        id: 2,
        titulo: 'Missões IPB anuncia novo campo missionário na África',
        descricao: 'Igreja envia missionários para iniciar trabalho de evangelização e plantação de igrejas.',
        dataPublicacao: '2025-10-28',
        categoria: 'Missões',
        link: 'https://ipb.org.br/noticia/missoes-africa',
        imagem: 'assets/images/noticia-ipb-2.jpg'
      },
      {
        id: 3,
        titulo: 'Seminário Teológico IPB abre inscrições para 2026',
        descricao: 'Instituição oferece cursos de graduação e pós-graduação em teologia reformada.',
        dataPublicacao: '2025-10-25',
        categoria: 'Educação',
        link: 'https://ipb.org.br/noticia/seminario-2026',
        imagem: 'assets/images/noticia-ipb-3.jpg'
      },
      {
        id: 4,
        titulo: 'Campanha de arrecadação para construção de templos',
        descricao: 'IPB lança campanha nacional para auxiliar congregações na construção de novos templos.',
        dataPublicacao: '2025-10-20',
        categoria: 'Projetos',
        link: 'https://ipb.org.br/noticia/campanha-templos',
        imagem: 'assets/images/noticia-ipb-4.jpg'
      }
    ];
  } catch (erro) {
    console.error('Erro ao buscar notícias IPB:', erro);
    return [];
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
