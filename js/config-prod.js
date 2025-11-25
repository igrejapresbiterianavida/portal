// ============================================
// CONFIG-PROD.JS - Configurações de Produção
// ============================================
// Apenas a URL do Supabase (pública) - sem credenciais!
// Todas as operações passam pelas Edge Functions

window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://cctxgigtobyltdicehwr.supabase.co'
};

console.log('✅ Configurações de produção carregadas (sem credenciais visíveis)');

