// ============================================
// YOUTUBE-SYNC.JS - Sincronização YouTube → Supabase
// ============================================

/**
 * Sincronizar vídeos do YouTube para o Supabase
 * Busca os últimos vídeos do canal e salva/atualiza no banco
 */
async function sincronizarVideosYouTube() {
  try {
    console.log('🔄 Iniciando sincronização de vídeos do YouTube...');
    
    // Buscar vídeos via RSS Feed do YouTube
    const videosYouTube = await buscarVideosYouTube(50); // Buscar mais vídeos
    
    if (!videosYouTube || videosYouTube.length === 0) {
      console.warn('⚠️ Nenhum vídeo encontrado no YouTube');
      return { sucesso: false, mensagem: 'Nenhum vídeo encontrado' };
    }
    
    console.log(`📹 ${videosYouTube.length} vídeos encontrados no YouTube`);
    
    // Verificar se Supabase está disponível
    if (!window.supabaseClient || !window.supabaseClient.client) {
      console.warn('⚠️ Supabase não disponível, apenas retornando vídeos');
      return { sucesso: true, videos: videosYouTube, sincronizado: false };
    }
    
    let criados = 0;
    let atualizados = 0;
    let erros = 0;
    
    // Processar cada vídeo
    for (const videoYT of videosYouTube) {
      try {
        // Verificar se o vídeo já existe no Supabase
        const videosExistentes = await window.supabaseClient.listar('videos', {
          igual: { video_id: videoYT.id },
          limite: 1
        });
        
        const videoExistente = videosExistentes[0];
        
        const dadosVideo = {
          video_id: videoYT.id,
          titulo: videoYT.titulo,
          descricao: videoYT.descricao,
          thumbnail_url: videoYT.thumbnail,
          url: videoYT.url,
          data_publicacao: videoYT.dataPublicacao ? new Date(videoYT.dataPublicacao).toISOString() : new Date().toISOString(),
          duracao: videoYT.duracao || null,
          visualizacoes: 0,
          ordem: 0,
          destaque: false
        };
        
        if (videoExistente) {
          // Atualizar vídeo existente
          await window.supabaseClient.atualizar('videos', videoExistente.id, dadosVideo);
          atualizados++;
          console.log(`✅ Vídeo atualizado: ${videoYT.titulo.substring(0, 50)}...`);
        } else {
          // Criar novo vídeo
          await window.supabaseClient.criar('videos', dadosVideo);
          criados++;
          console.log(`➕ Vídeo criado: ${videoYT.titulo.substring(0, 50)}...`);
        }
      } catch (erro) {
        console.error(`❌ Erro ao processar vídeo ${videoYT.id}:`, erro);
        erros++;
      }
    }
    
    console.log(`✅ Sincronização concluída: ${criados} criados, ${atualizados} atualizados, ${erros} erros`);
    
    return {
      sucesso: true,
      sincronizado: true,
      criados,
      atualizados,
      erros,
      total: videosYouTube.length
    };
  } catch (erro) {
    console.error('❌ Erro na sincronização:', erro);
    return { sucesso: false, erro: erro.message };
  }
}

/**
 * Verificar e atualizar status de live streaming
 */
async function verificarEAtualizarLive() {
  try {
    const statusLive = await verificarLiveYouTube();
    
    if (!window.supabaseClient || !window.supabaseClient.client) {
      return statusLive;
    }
    
    // Se houver live, você pode salvar no banco ou apenas retornar
    // Por enquanto, apenas retornamos o status
    return statusLive;
  } catch (erro) {
    console.error('❌ Erro ao verificar live:', erro);
    return { aoVivo: false };
  }
}

/**
 * Buscar vídeos melhorado com mais informações (via RSS Feed)
 */
async function buscarVideosYouTubeCompleto(maxResults = 6) {
  try {
    const canalId = CONFIG.CANAL_ID;
    
    if (!canalId) {
      console.warn('⚠️ Canal ID não configurado');
      return [];
    }
    
    // Usar RSS Feed (já retorna todos os dados necessários)
    if (typeof window.buscarVideosYouTubeRSS === 'function') {
      const videos = await window.buscarVideosYouTubeRSS(canalId);
      return videos.slice(0, maxResults);
    }
    
    // Fallback para função padrão
    if (typeof window.buscarVideosYouTube === 'function') {
      return await window.buscarVideosYouTube(maxResults);
    }
    
    return [];
  } catch (erro) {
    console.error('Erro ao buscar vídeos completos:', erro);
    return [];
  }
}

// Exportar funções
window.sincronizarVideosYouTube = sincronizarVideosYouTube;
window.verificarEAtualizarLive = verificarEAtualizarLive;
window.buscarVideosYouTubeCompleto = buscarVideosYouTubeCompleto;

