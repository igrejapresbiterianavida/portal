/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { auth_user_id, nova_senha } = await req.json()

    if (!auth_user_id || !nova_senha) {
      throw new Error('auth_user_id e nova_senha são obrigatórios')
    }

    if (nova_senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Atualizar senha do usuário
    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      auth_user_id,
      { password: nova_senha }
    )

    if (error) throw error

    // Buscar dados do usuário para enviar email
    const { data: usuario } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', auth_user_id)
      .single()

    // Enviar email com nova senha
    if (usuario) {
      try {
        const emailFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-email-senha`
        
        await fetch(emailFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          },
          body: JSON.stringify({
            email: usuario.email,
            nome: usuario.nome,
            senha: nova_senha,
            tipo: 'alteracao'
          })
        })
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email (senha foi alterada):', emailError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha atualizada com sucesso! Um email foi enviado com a nova senha.'
      }),
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

