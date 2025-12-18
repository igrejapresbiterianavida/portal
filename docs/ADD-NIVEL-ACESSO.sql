-- ============================================
-- ADD-NIVEL-ACESSO.sql
-- Adiciona a coluna nivel_acesso em todas as tabelas necessárias
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Devocionais
ALTER TABLE public.devocionais 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Vídeos
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Programação
ALTER TABLE public.programacao 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Eventos
ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Redes Sociais
ALTER TABLE public.redes_sociais 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Turmas Catecúmenos
ALTER TABLE public.turmas_catecumenos 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Notificações
ALTER TABLE public.notificacoes 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Avisos Popup
ALTER TABLE public.avisos_popup 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Dados Bancários
ALTER TABLE public.dados_bancarios 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['visitante', 'membro', 'lideranca', 'administracao'];

-- Grupos de Estudo
ALTER TABLE public.grupos_estudo 
ADD COLUMN IF NOT EXISTS nivel_acesso TEXT[] DEFAULT ARRAY['membro', 'lideranca', 'administracao'];

-- Confirmar alterações
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name = 'nivel_acesso' 
AND table_schema = 'public'
ORDER BY table_name;

