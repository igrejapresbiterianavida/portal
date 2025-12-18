-- =====================================================================
-- SCRIPT: Adicionar campos de perfil ao usuário
-- Data: 2025-12-18
-- =====================================================================

-- Adicionar campos opcionais na tabela de usuários
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS como_conheceu TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Remover a obrigatoriedade de campos na tabela catecumenos
-- (apenas nome, email, telefone são obrigatórios)
ALTER TABLE public.catecumenos
ALTER COLUMN telefone DROP NOT NULL;

-- Adicionar coluna telefone se não existir
ALTER TABLE public.catecumenos
ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Verificar estrutura atual
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'usuarios' OR table_name = 'catecumenos'
-- ORDER BY table_name, ordinal_position;

-- Confirmar alterações
SELECT 'Campos adicionados com sucesso!' AS status;


