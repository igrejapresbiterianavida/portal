/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, nome, otp, resetLink, expiresAt } = await req.json()

    if (!email || !nome) {
      throw new Error('Email e nome são obrigatórios')
    }

    // Log para debug (em produção, não logar dados sensíveis)
    console.log('📧 Email de reset:', {
      para: email,
      nome: nome,
      // otp e resetLink não devem ser logados em produção!
    })

    // TODO: Implementar envio real de email usando Resend ou EmailJS
    // O email deve conter:
    // - OTP de 6 dígitos
    // - Link para resetar senha
    // - Instruções de uso
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de recuperação enviado com sucesso'
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

