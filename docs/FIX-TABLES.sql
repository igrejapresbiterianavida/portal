-- ============================================
-- FIX-TABLES.sql
-- Execute este SQL no Supabase Dashboard
-- SQL Editor -> New Query -> Paste -> Run
-- ============================================

-- 1. Função necessária para triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- 2. Tabela de notificações
create table if not exists public.notificacoes (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  mensagem text not null,
  tipo text not null default 'info',
  icone text default 'notifications',
  link text,
  link_texto text,
  nivel_acesso text not null default 'publico',
  data_expiracao timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 3. Tabela de turmas de catecúmenos
create table if not exists public.turmas_catecumenos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  descricao text,
  data_inicio date not null,
  data_fim date,
  dia_semana text,
  horario text,
  local text,
  vagas integer not null default 20,
  instrutor text,
  etapa_atual integer not null default 1,
  total_etapas integer not null default 10,
  requer_aprovacao boolean not null default true,
  status text not null default 'aberta',
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 4. Tabela de catecúmenos (inscrições)
create table if not exists public.catecumenos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text,
  telefone text not null,
  data_nascimento date,
  endereco text,
  estado_civil text,
  profissao text,
  como_conheceu text,
  ja_batizado boolean default false,
  igreja_anterior text,
  motivacao text,
  disponibilidade text,
  status text not null default 'pendente',
  turma_id uuid references public.turmas_catecumenos(id),
  observacoes text,
  usuario_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 5. Tabela de avisos popup
create table if not exists public.avisos_popup (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  conteudo text not null,
  tipo text not null default 'informativo',
  imagem_url text,
  botao_texto text default 'Entendi',
  botao_link text,
  nivel_acesso text not null default 'publico',
  data_inicio timestamptz not null default timezone('utc', now()),
  data_fim timestamptz,
  mostrar_uma_vez boolean not null default false,
  prioridade integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- 6. Criar triggers (ignorar se já existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notificacoes_set_updated') THEN
    CREATE TRIGGER trg_notificacoes_set_updated
    BEFORE UPDATE ON public.notificacoes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_turmas_catecumenos_set_updated') THEN
    CREATE TRIGGER trg_turmas_catecumenos_set_updated
    BEFORE UPDATE ON public.turmas_catecumenos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_catecumenos_set_updated') THEN
    CREATE TRIGGER trg_catecumenos_set_updated
    BEFORE UPDATE ON public.catecumenos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_avisos_popup_set_updated') THEN
    CREATE TRIGGER trg_avisos_popup_set_updated
    BEFORE UPDATE ON public.avisos_popup
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 7. Inserir turma de exemplo para teste
INSERT INTO public.turmas_catecumenos (nome, descricao, data_inicio, dia_semana, horario, local, vagas, instrutor, status, ativo)
VALUES 
  ('Turma de Catecúmenos 2025/1', 'Classe introdutória para novos membros da igreja', '2025-02-01', 'sabado', '09:00 - 11:00', 'Salão Principal', 20, 'Rev. Pastor', 'aberta', true),
  ('Turma Online 2025', 'Classe de catecúmenos online via Zoom', '2025-02-15', 'quarta', '19:30 - 21:00', 'Online (Zoom)', 15, 'Presb. Auxiliar', 'aberta', true)
ON CONFLICT DO NOTHING;

-- 8. Inserir notificação de teste
INSERT INTO public.notificacoes (titulo, mensagem, tipo, icone, nivel_acesso)
VALUES (
  'Bem-vindo ao Portal!',
  'Sistema de notificações ativo. Você receberá avisos sobre novos vídeos, programações e eventos.',
  'info',
  'celebration',
  'publico'
) ON CONFLICT DO NOTHING;

-- 9. Habilitar RLS e políticas públicas
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_catecumenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catecumenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_popup ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
DROP POLICY IF EXISTS "Leitura pública notificacoes" ON public.notificacoes;
CREATE POLICY "Leitura pública notificacoes" ON public.notificacoes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública turmas_catecumenos" ON public.turmas_catecumenos;
CREATE POLICY "Leitura pública turmas_catecumenos" ON public.turmas_catecumenos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserção pública catecumenos" ON public.catecumenos;
CREATE POLICY "Inserção pública catecumenos" ON public.catecumenos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura pública avisos_popup" ON public.avisos_popup;
CREATE POLICY "Leitura pública avisos_popup" ON public.avisos_popup FOR SELECT USING (true);

-- Política para admin gerenciar tudo
DROP POLICY IF EXISTS "Admin full access notificacoes" ON public.notificacoes;
CREATE POLICY "Admin full access notificacoes" ON public.notificacoes FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access turmas" ON public.turmas_catecumenos;
CREATE POLICY "Admin full access turmas" ON public.turmas_catecumenos FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access catecumenos" ON public.catecumenos;
CREATE POLICY "Admin full access catecumenos" ON public.catecumenos FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access avisos" ON public.avisos_popup;
CREATE POLICY "Admin full access avisos" ON public.avisos_popup FOR ALL USING (true);

-- 10. Adicionar campos de links para turmas de catecúmenos
DO $$
BEGIN
  -- Adicionar campo link_google_meet se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'turmas_catecumenos' AND column_name = 'link_google_meet') THEN
    ALTER TABLE public.turmas_catecumenos ADD COLUMN link_google_meet text;
  END IF;
  
  -- Adicionar campo link_whatsapp se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'turmas_catecumenos' AND column_name = 'link_whatsapp') THEN
    ALTER TABLE public.turmas_catecumenos ADD COLUMN link_whatsapp text;
  END IF;
END $$;

-- Atualizar turmas de exemplo com links fictícios (para teste)
UPDATE public.turmas_catecumenos 
SET link_google_meet = 'https://meet.google.com/abc-defg-hij',
    link_whatsapp = 'https://chat.whatsapp.com/EXEMPLO123456'
WHERE nome LIKE '%2025%' AND link_google_meet IS NULL;

SELECT 'SUCESSO! Tabelas criadas e atualizadas. Recarregue o site.' as resultado;

