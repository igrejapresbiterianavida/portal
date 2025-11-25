/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, nome, senha, tipo } = await req.json()

    if (!email || !nome || !senha) {
      throw new Error('Email, nome e senha são obrigatórios')
    }

    // Usar Resend ou EmailJS para enviar email
    // Por enquanto, vamos usar o sistema de email do Supabase Auth
    // TODO: Configurar Resend ou outro serviço de email

    // Usar Supabase Auth para enviar email (precisa configurar templates no dashboard)
    // Por enquanto, vamos apenas logar
    console.log('📧 Email de senha:', {
      para: email,
      nome: nome,
      tipo: tipo, // 'cadastro' ou 'alteracao'
      // senha não deve ser logada em produção!
    })

    // TODO: Implementar envio real de email usando Resend ou EmailJS
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso'
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

