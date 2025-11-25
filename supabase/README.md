# 🚀 Deploy das Supabase Edge Functions

## 📋 Pré-requisitos

1. Instalar Supabase CLI:
```bash
npm install -g supabase
```

2. Fazer login:
```bash
supabase login
```

3. Linkar ao projeto:
```bash
supabase link --project-ref cctxgigtobyltdicehwr
```

## 📦 Deploy das Funções

### Deploy de todas as funções:
```bash
supabase functions deploy listar
supabase functions deploy buscar-por-id
supabase functions deploy criar
supabase functions deploy atualizar
supabase functions deploy deletar
supabase functions deploy get-devocional-ativo
supabase functions deploy get-dados-igreja
```

### Ou deploy de todas de uma vez (se suportado):
```bash
cd supabase/functions
for dir in */; do
  supabase functions deploy "${dir%/}"
done
```

## 🔐 Variáveis de Ambiente

As variáveis de ambiente já estão configuradas no painel do Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Importante:** Não é necessário configurar manualmente se já foram configuradas no painel!

## ✅ Verificar Deploy

Após o deploy, você pode testar as funções:
```bash
curl -X POST https://cctxgigtobyltdicehwr.supabase.co/functions/v1/listar \
  -H "Content-Type: application/json" \
  -d '{"tabela": "devocionais", "filtros": {}}'
```

## 📝 Notas

- Todas as funções estão configuradas com CORS para aceitar requisições de qualquer origem
- As credenciais ficam seguras no servidor (Edge Functions)
- O frontend só precisa da URL do Supabase (pública)

