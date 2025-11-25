/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tabela, filtros = {} } = await req.json()

    if (!tabela) {
      throw new Error('Tabela é obrigatória')
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query = supabaseClient.from(tabela).select('*')

    // Aplicar filtros
    if (filtros.ordem) {
      query = query.order(filtros.ordem.campo, { ascending: filtros.ordem.ascendente !== false })
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite)
    }

    if (filtros.igual) {
      Object.entries(filtros.igual).forEach(([campo, valor]) => {
        query = query.eq(campo, valor)
      })
    }

    if (filtros.filtro) {
      const { campo, operador, valor } = filtros.filtro
      if (campo && operador && valor !== undefined) {
        switch (operador.toLowerCase()) {
          case 'eq':
            query = query.eq(campo, valor)
            break
          case 'neq':
            query = query.neq(campo, valor)
            break
          case 'gt':
            query = query.gt(campo, valor)
            break
          case 'gte':
            query = query.gte(campo, valor)
            break
          case 'lt':
            query = query.lt(campo, valor)
            break
          case 'lte':
            query = query.lte(campo, valor)
            break
          case 'like':
            query = query.like(campo, `%${valor}%`)
            break
        }
      }
    }

    const { data, error } = await query

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data: data || [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

