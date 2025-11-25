// ============================================
// CONFIG-PROD.JS - Configurações de Produção
// ============================================
// A anon key é pública e segura para uso no frontend
// Ela é necessária para autenticar requisições às Edge Functions

window.SUPABASE_CONFIG = {
  SUPABASE_URL: 'https://cctxgigtobyltdicehwr.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdHhnaWd0b2J5bHRkaWNlaHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzIzMDIsImV4cCI6MjA3OTYwODMwMn0.6bBbaS2BbwMKkowZYcardP3prg1w2wlqRFuAekU8M8s'
};

console.log('✅ Configurações de produção carregadas');

