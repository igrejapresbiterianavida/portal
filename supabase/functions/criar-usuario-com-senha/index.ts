/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, sobrenome, email, senha, telefone, tipo } = await req.json()

    if (!nome || !email || !senha) {
      throw new Error('Nome, email e senha são obrigatórios')
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido')
    }

    // Validar senha
    if (senha.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email.toLowerCase(),
      password: senha,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome: nome,
        sobrenome: sobrenome || '',
        full_name: `${nome} ${sobrenome || ''}`.trim()
      }
    })

    if (authError) {
      // Se o usuário já existe, tentar buscar
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        throw new Error('Este email já está cadastrado. Faça login ou use "Esqueci minha senha".')
      }
      throw authError
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário no sistema de autenticação')
    }

    // 2. Criar perfil na tabela usuarios
    const { data: usuarioData, error: usuarioError } = await supabaseClient
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome: nome,
        sobrenome: sobrenome || '',
        email: email.toLowerCase(),
        telefone: telefone || null,
        tipo: tipo || 'visitante',
        status: 'ativo'
      })
      .select()
      .single()

    if (usuarioError) {
      // Se der erro ao criar perfil, tentar deletar o usuário auth criado
      console.error('Erro ao criar perfil:', usuarioError)
      // Não deletar o usuário auth pois pode ter sido criado manualmente antes
      throw new Error('Erro ao criar perfil do usuário: ' + usuarioError.message)
    }

    // 3. Enviar email com senha
    try {
      // Usar Edge Function para enviar email
      const emailFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-email-senha`
      
      await fetch(emailFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          nome: nome,
          senha: senha,
          tipo: 'cadastro'
        })
      })
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar email (usuário foi criado):', emailError)
      // Não falhar se o email não for enviado
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          usuario: usuarioData,
          auth_user_id: authData.user.id
        },
        message: 'Usuário criado com sucesso! Verifique seu email para confirmar a senha.'
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

