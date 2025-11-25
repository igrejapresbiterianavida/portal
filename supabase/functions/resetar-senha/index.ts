/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      throw new Error('Email é obrigatório')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar usuário pelo email
    const { data: usuarios, error: usuariosError } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (usuariosError || !usuarios) {
      // Não revelar que o email não existe (segurança)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o email estiver cadastrado, você receberá instruções para resetar sua senha.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Gerar OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Salvar OTP na tabela (expira em 15 minutos)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    
    // Usar uma tabela de resets de senha ou armazenar temporariamente
    // Por simplicidade, vamos usar user_metadata ou criar uma tabela
    // Por enquanto, vamos usar o sistema de reset do Supabase Auth
    
    // Gerar link de reset usando Supabase Auth
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase(),
    })

    if (resetError) {
      throw resetError
    }

    // Enviar email com OTP e link
    try {
      const emailFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-email-reset`
      
      await fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          nome: usuarios.nome,
          otp: otp,
          resetLink: resetData.properties.action_link,
          expiresAt: expiresAt
        })
      })
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar email:', emailError)
      throw new Error('Erro ao enviar email de recuperação')
    }

    // Salvar OTP no banco para validação
    // Por enquanto, vamos retornar o OTP na resposta (em produção, apenas enviar por email)
    // TODO: Criar tabela de resets de senha para armazenar OTP

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Instruções para resetar sua senha foram enviadas para seu email.',
        // Em produção, não retornar OTP na resposta
        // otp: otp // Apenas para debug - remover em produção
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

