// ============================================
// CONFIG-PROD.JS - Configurações de Produção
// ============================================
// 
// ✅ SEGURANÇA:
// - SUPABASE_ANON_KEY é PÚBLICA e SEGURA para estar no código
// - Ela é protegida pelas Row Level Security (RLS) policies do Supabase
// - Esta key só permite operações que as policies permitem
// - A SERVICE_ROLE_KEY (privada) fica segura no Supabase (Edge Functions Secrets)
// 
// ✅ Este arquivo pode fazer deploy no GitHub sem problemas!
//

window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://cctxgigtobyltdicehwr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdHhnaWd0b2J5bHRkaWNlaHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzIzMDIsImV4cCI6MjA3OTYwODMwMn0.6bBbaS2BbwMKkowZYcardP3prg1w2wlqRFuAekU8M8s'
};

// Configurações adicionais (não sensíveis)
window.SUPABASE_CONFIG.CANAL_ID = 'UCTOsnSoOX31RB6Dr_kh9sHw'; // @ipbvida

console.log('✅ Configurações de produção carregadas');


