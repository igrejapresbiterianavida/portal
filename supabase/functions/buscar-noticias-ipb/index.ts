/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RSS_URL = 'https://ipb.org.br/feed/rss'
    
    // Buscar RSS do IPB
    const response = await fetch(RSS_URL)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const xmlText = await response.text()
    
    // Parser simples de RSS XML
    const noticias: Array<{
      id: string
      titulo: string
      descricao: string
      dataPublicacao: string
      categoria: string
      link: string
      imagem: string
    }> = []
    
    // Extrair itens do RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    let idCounter = 1
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1]
      
      // Extrair título
      const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)
      const titulo = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : ''
      
      // Extrair descrição
      const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)
      let descricao = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : ''
      // Limpar HTML da descrição
      descricao = descricao.replace(/<[^>]*>/g, '').substring(0, 200)
      
      // Extrair link
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/)
      const link = linkMatch ? linkMatch[1].trim() : ''
      
      // Extrair data
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)
      let dataPublicacao = ''
      if (pubDateMatch) {
        const date = new Date(pubDateMatch[1])
        dataPublicacao = date.toISOString().split('T')[0]
      }
      
      // Extrair categoria
      const categoryMatch = itemContent.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>|<category>(.*?)<\/category>/)
      const categoria = categoryMatch ? (categoryMatch[1] || categoryMatch[2] || 'Notícias').trim() : 'Notícias'
      
      // Extrair imagem (de <enclosure> ou <media:content> ou primeiro <img> na descrição)
      let imagem = ''
      const enclosureMatch = itemContent.match(/<enclosure\s+url="(.*?)"/)
      const mediaMatch = itemContent.match(/<media:content\s+url="(.*?)"/)
      const imgMatch = itemContent.match(/<img\s+src="(.*?)"/)
      
      if (enclosureMatch) {
        imagem = enclosureMatch[1]
      } else if (mediaMatch) {
        imagem = mediaMatch[1]
      } else if (imgMatch) {
        imagem = imgMatch[1]
      }
      
      if (titulo && link) {
        noticias.push({
          id: String(idCounter++),
          titulo,
          descricao: descricao || 'Leia mais no site da IPB',
          dataPublicacao: dataPublicacao || new Date().toISOString().split('T')[0],
          categoria,
          link,
          imagem: imagem || 'assets/images/logo-verde.svg'
        })
      }
    }
    
    // Limitar a 10 notícias mais recentes
    const noticiasLimitadas = noticias.slice(0, 10)
    
    return new Response(
      JSON.stringify({ success: true, data: noticiasLimitadas }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erro ao buscar notícias IPB:', error)
    
    // Retornar dados mockados em caso de erro (fallback)
    const noticiasMock = [
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
    ]
    
    return new Response(
      JSON.stringify({ success: true, data: noticiasMock }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})

