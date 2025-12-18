-- ============================================
-- SCHEMA-COMPLETO.sql
-- Portal IPV - Schema Completo com Níveis de Acesso
-- Execute este SQL no Supabase Dashboard
-- SQL Editor -> New Query -> Paste -> Run
-- ============================================

-- ==================== FUNÇÕES AUXILIARES ====================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ==================== TABELA: USUARIOS ====================

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  avatar_url TEXT,
  tipo TEXT NOT NULL DEFAULT 'visitante' CHECK (tipo IN ('visitante', 'membro', 'lideranca', 'administracao')),
  data_nascimento DATE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  data_membro DATE,
  cargo TEXT,
  ministerios TEXT[],
  observacoes TEXT,
  ultimo_acesso TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: NOTIFICAÇÕES ====================

CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info',
  icone TEXT DEFAULT 'notifications',
  link TEXT,
  link_texto TEXT,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  enviar_email BOOLEAN DEFAULT FALSE,
  data_expiracao TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Tabela de relacionamento notificações x usuários
CREATE TABLE IF NOT EXISTS public.notificacoes_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notificacao_id UUID REFERENCES public.notificacoes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  lida BOOLEAN DEFAULT FALSE,
  data_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(notificacao_id, usuario_id)
);

-- ==================== TABELA: AVISOS POP-UP ====================

CREATE TABLE IF NOT EXISTS public.avisos_popup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'informativo',
  imagem_url TEXT,
  botao_texto TEXT DEFAULT 'Entendi',
  botao_link TEXT,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  data_fim TIMESTAMPTZ,
  mostrar_uma_vez BOOLEAN NOT NULL DEFAULT FALSE,
  prioridade INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Tabela de visualização de avisos
CREATE TABLE IF NOT EXISTS public.avisos_usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aviso_id UUID REFERENCES public.avisos_popup(id) ON DELETE CASCADE,
  usuario_id UUID,
  sessao_id TEXT,
  status TEXT DEFAULT 'visualizado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: DEVOCIONAIS ====================

CREATE TABLE IF NOT EXISTS public.devocionais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT,
  texto TEXT NOT NULL,
  referencia TEXT,
  autor TEXT,
  imagem_url TEXT,
  data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: PROGRAMAÇÃO ====================

CREATE TABLE IF NOT EXISTS public.programacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  horario TEXT,
  local TEXT DEFAULT 'Igreja',
  categoria TEXT NOT NULL DEFAULT 'culto',
  imagem_url TEXT,
  cor1 TEXT DEFAULT '#1A4731',
  cor2 TEXT DEFAULT '#2D5F4A',
  link_inscricao TEXT,
  vagas INTEGER,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: VÍDEOS ====================

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  youtube_id TEXT NOT NULL,
  url TEXT,
  thumbnail TEXT,
  duracao TEXT,
  data_publicacao TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  categoria TEXT DEFAULT 'culto',
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  visualizacoes INTEGER DEFAULT 0,
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: VISITANTES ====================

CREATE TABLE IF NOT EXISTS public.visitantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  data_visita DATE NOT NULL,
  como_conheceu TEXT,
  mensagem TEXT,
  status TEXT DEFAULT 'confirmado',
  convertido_membro BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: DADOS DA IGREJA ====================

CREATE TABLE IF NOT EXISTS public.dados_igreja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: REDES SOCIAIS ====================

CREATE TABLE IF NOT EXISTS public.redes_sociais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  icone TEXT NOT NULL,
  url TEXT NOT NULL,
  cor TEXT,
  ordem INTEGER DEFAULT 0,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: TURMAS DE CATECÚMENOS ====================

CREATE TABLE IF NOT EXISTS public.turmas_catecumenos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  dia_semana TEXT,
  horario TEXT,
  local TEXT,
  vagas INTEGER NOT NULL DEFAULT 20,
  instrutor TEXT,
  link_google_meet TEXT,
  link_whatsapp TEXT,
  etapa_atual INTEGER NOT NULL DEFAULT 1,
  total_etapas INTEGER NOT NULL DEFAULT 10,
  requer_aprovacao BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'aberta',
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: CATECÚMENOS (INSCRIÇÕES) ====================

CREATE TABLE IF NOT EXISTS public.catecumenos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT NOT NULL,
  data_nascimento DATE,
  endereco TEXT,
  estado_civil TEXT,
  profissao TEXT,
  como_conheceu TEXT,
  ja_batizado BOOLEAN DEFAULT FALSE,
  igreja_anterior TEXT,
  motivacao TEXT,
  disponibilidade TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  turma_id UUID REFERENCES public.turmas_catecumenos(id),
  observacoes TEXT,
  usuario_id UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: GRUPOS DE ESTUDO ====================

CREATE TABLE IF NOT EXISTS public.grupos_estudo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  descricao TEXT,
  dia_semana TEXT,
  horario TEXT,
  local TEXT,
  lider TEXT,
  lider_telefone TEXT,
  link_whatsapp TEXT,
  link_meet TEXT,
  tipo TEXT DEFAULT 'presencial',
  vagas INTEGER DEFAULT 15,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['membro', 'lideranca', 'administracao'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: MEMBROS DOS GRUPOS ====================

CREATE TABLE IF NOT EXISTS public.grupos_estudo_membros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id UUID REFERENCES public.grupos_estudo(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  papel TEXT DEFAULT 'participante',
  data_entrada DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(grupo_id, usuario_id)
);

-- ==================== TABELA: DADOS BANCÁRIOS ====================

CREATE TABLE IF NOT EXISTS public.dados_bancarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL DEFAULT 'principal',
  favorecido TEXT NOT NULL,
  cnpj TEXT,
  banco_nome TEXT NOT NULL,
  banco_codigo TEXT,
  agencia TEXT NOT NULL,
  conta TEXT NOT NULL,
  pix_tipo TEXT,
  pix_chave TEXT,
  qrcode_url TEXT,
  instrucoes TEXT,
  nivel_acesso TEXT[] NOT NULL DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'],
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: PUSH SUBSCRIPTIONS ====================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(usuario_id, endpoint)
);

-- ==================== TABELA: LOG DE EMAILS ====================

CREATE TABLE IF NOT EXISTS public.emails_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT,
  tipo TEXT DEFAULT 'notificacao',
  status TEXT DEFAULT 'enviado',
  erro_mensagem TEXT,
  notificacao_id UUID REFERENCES public.notificacoes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== TABELA: CONFIGURAÇÕES ====================

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  editavel BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==================== ADICIONAR COLUNAS FALTANTES ====================

-- Adicionar nivel_acesso em tabelas existentes
DO $$
BEGIN
  -- notificacoes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notificacoes' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.notificacoes ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  -- avisos_popup
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avisos_popup' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.avisos_popup ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  -- devocionais
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devocionais' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.devocionais ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  -- programacao
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programacao' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.programacao ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  -- videos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.videos ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  -- redes_sociais
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redes_sociais' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.redes_sociais ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  -- turmas_catecumenos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turmas_catecumenos' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.turmas_catecumenos ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turmas_catecumenos' AND column_name = 'link_google_meet') THEN
    ALTER TABLE public.turmas_catecumenos ADD COLUMN link_google_meet TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turmas_catecumenos' AND column_name = 'link_whatsapp') THEN
    ALTER TABLE public.turmas_catecumenos ADD COLUMN link_whatsapp TEXT;
  END IF;
  
  -- grupos_estudo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grupos_estudo' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.grupos_estudo ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['membro', 'lideranca', 'administracao'];
  END IF;
  
  -- dados_bancarios
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dados_bancarios' AND column_name = 'nivel_acesso') THEN
    ALTER TABLE public.dados_bancarios ADD COLUMN nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];
  END IF;
END $$;

-- ==================== ROW LEVEL SECURITY ====================

-- Habilitar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_popup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devocionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_igreja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redes_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas_catecumenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catecumenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_estudo_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para recriar
DROP POLICY IF EXISTS "Leitura pública" ON public.notificacoes;
DROP POLICY IF EXISTS "Leitura pública" ON public.avisos_popup;
DROP POLICY IF EXISTS "Leitura pública" ON public.devocionais;
DROP POLICY IF EXISTS "Leitura pública" ON public.programacao;
DROP POLICY IF EXISTS "Leitura pública" ON public.videos;
DROP POLICY IF EXISTS "Leitura pública" ON public.dados_igreja;
DROP POLICY IF EXISTS "Leitura pública" ON public.redes_sociais;
DROP POLICY IF EXISTS "Leitura pública" ON public.turmas_catecumenos;
DROP POLICY IF EXISTS "Leitura pública" ON public.grupos_estudo;
DROP POLICY IF EXISTS "Leitura pública" ON public.dados_bancarios;

-- Políticas de leitura (sem verificar ativo para evitar erro)
CREATE POLICY "Select notificacoes" ON public.notificacoes FOR SELECT USING (true);
CREATE POLICY "Select avisos" ON public.avisos_popup FOR SELECT USING (true);
CREATE POLICY "Select devocionais" ON public.devocionais FOR SELECT USING (true);
CREATE POLICY "Select programacao" ON public.programacao FOR SELECT USING (true);
CREATE POLICY "Select videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Select dados_igreja" ON public.dados_igreja FOR SELECT USING (true);
CREATE POLICY "Select redes_sociais" ON public.redes_sociais FOR SELECT USING (true);
CREATE POLICY "Select turmas" ON public.turmas_catecumenos FOR SELECT USING (true);
CREATE POLICY "Select grupos" ON public.grupos_estudo FOR SELECT USING (true);
CREATE POLICY "Select dados_bancarios" ON public.dados_bancarios FOR SELECT USING (true);
CREATE POLICY "Select usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Select visitantes" ON public.visitantes FOR SELECT USING (true);
CREATE POLICY "Select catecumenos" ON public.catecumenos FOR SELECT USING (true);

-- Políticas de inserção
DROP POLICY IF EXISTS "Inserção pública" ON public.visitantes;
DROP POLICY IF EXISTS "Inserção pública" ON public.catecumenos;
DROP POLICY IF EXISTS "Inserção pública" ON public.avisos_usuarios;
DROP POLICY IF EXISTS "Inserção pública" ON public.notificacoes_usuarios;

CREATE POLICY "Insert visitantes" ON public.visitantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert catecumenos" ON public.catecumenos FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert avisos_usuarios" ON public.avisos_usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert notificacoes_usuarios" ON public.notificacoes_usuarios FOR INSERT WITH CHECK (true);

-- Políticas de acesso total (INSERT, UPDATE, DELETE)
CREATE POLICY "All notificacoes" ON public.notificacoes FOR ALL USING (true);
CREATE POLICY "All avisos" ON public.avisos_popup FOR ALL USING (true);
CREATE POLICY "All devocionais" ON public.devocionais FOR ALL USING (true);
CREATE POLICY "All programacao" ON public.programacao FOR ALL USING (true);
CREATE POLICY "All videos" ON public.videos FOR ALL USING (true);
CREATE POLICY "All dados_igreja" ON public.dados_igreja FOR ALL USING (true);
CREATE POLICY "All redes_sociais" ON public.redes_sociais FOR ALL USING (true);
CREATE POLICY "All turmas" ON public.turmas_catecumenos FOR ALL USING (true);
CREATE POLICY "All grupos" ON public.grupos_estudo FOR ALL USING (true);
CREATE POLICY "All dados_bancarios" ON public.dados_bancarios FOR ALL USING (true);
CREATE POLICY "All usuarios" ON public.usuarios FOR ALL USING (true);
CREATE POLICY "All visitantes" ON public.visitantes FOR ALL USING (true);
CREATE POLICY "All catecumenos" ON public.catecumenos FOR ALL USING (true);
CREATE POLICY "All grupos_membros" ON public.grupos_estudo_membros FOR ALL USING (true);
CREATE POLICY "All avisos_usuarios" ON public.avisos_usuarios FOR ALL USING (true);
CREATE POLICY "All notificacoes_usuarios" ON public.notificacoes_usuarios FOR ALL USING (true);
CREATE POLICY "All push_subscriptions" ON public.push_subscriptions FOR ALL USING (true);
CREATE POLICY "All emails_log" ON public.emails_log FOR ALL USING (true);
CREATE POLICY "All configuracoes" ON public.configuracoes FOR ALL USING (true);

-- ==================== DADOS INICIAIS ====================

-- Inserir redes sociais padrão
INSERT INTO public.redes_sociais (nome, icone, url, ordem, nivel_acesso) VALUES
  ('Instagram', 'bi-instagram', 'https://instagram.com/ipbvida', 1, ARRAY['visitante', 'membro', 'lideranca', 'administracao']),
  ('YouTube', 'bi-youtube', 'https://youtube.com/@ipbvida', 2, ARRAY['visitante', 'membro', 'lideranca', 'administracao']),
  ('Facebook', 'bi-facebook', 'https://facebook.com/ipbvida', 3, ARRAY['visitante', 'membro', 'lideranca', 'administracao']),
  ('WhatsApp', 'bi-whatsapp', 'https://wa.me/5519995161006', 4, ARRAY['membro', 'lideranca', 'administracao'])
ON CONFLICT DO NOTHING;

-- Inserir notificação de boas-vindas
INSERT INTO public.notificacoes (titulo, mensagem, tipo, icone, nivel_acesso, ativo) VALUES
  ('Bem-vindo ao Portal IPV!', 'Sistema de notificações ativo. Você receberá avisos sobre eventos e programações.', 'info', 'celebration', ARRAY['visitante', 'membro', 'lideranca', 'administracao'], true)
ON CONFLICT DO NOTHING;

-- Inserir turma de exemplo
INSERT INTO public.turmas_catecumenos (nome, descricao, data_inicio, dia_semana, horario, local, vagas, instrutor, status, nivel_acesso, ativo) VALUES
  ('Catecúmenos 2025/1', 'Classe de formação para novos membros', '2025-02-01', 'sabado', '09:00 - 11:00', 'Salão Principal', 20, 'Rev. Pastor', 'aberta', ARRAY['visitante', 'membro', 'lideranca', 'administracao'], true)
ON CONFLICT DO NOTHING;

-- ==================== SUCESSO ====================

SELECT 'SUCESSO! Schema atualizado com níveis de acesso.' as resultado;
