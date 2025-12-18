-- =========================================================
-- UPDATE-AGENDAMENTO.sql
-- Adiciona campos de período para Devocionais, Programação e Eventos
-- Permite agendamento com data/hora de início e fim
-- =========================================================

-- =========================================================
-- 1. DEVOCIONAIS - Adicionar hora início e fim
-- =========================================================
ALTER TABLE public.devocionais
ADD COLUMN IF NOT EXISTS hora_inicio TIME DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS hora_fim TIME DEFAULT '23:59:59',
ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Comentários explicativos
COMMENT ON COLUMN public.devocionais.hora_inicio IS 'Hora que o devocional começa a ser exibido';
COMMENT ON COLUMN public.devocionais.hora_fim IS 'Hora que o devocional para de ser exibido';
COMMENT ON COLUMN public.devocionais.data_fim IS 'Data final de exibição (se null, usa data_publicacao)';

-- =========================================================
-- 2. PROGRAMAÇÃO - Adicionar período completo
-- =========================================================
ALTER TABLE public.programacao
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS hora_inicio TIME DEFAULT '00:00:00',
ADD COLUMN IF NOT EXISTS data_fim DATE,
ADD COLUMN IF NOT EXISTS hora_fim TIME DEFAULT '23:59:59';

-- Atualizar registros existentes para usar a data atual dos campos dia/mes/ano
UPDATE public.programacao 
SET data_inicio = make_date(ano::int, 
  CASE mes 
    WHEN 'jan' THEN 1 WHEN 'fev' THEN 2 WHEN 'mar' THEN 3 
    WHEN 'abr' THEN 4 WHEN 'mai' THEN 5 WHEN 'jun' THEN 6
    WHEN 'jul' THEN 7 WHEN 'ago' THEN 8 WHEN 'set' THEN 9
    WHEN 'out' THEN 10 WHEN 'nov' THEN 11 WHEN 'dez' THEN 12
    ELSE 1
  END, dia::int)
WHERE data_inicio IS NULL;

COMMENT ON COLUMN public.programacao.data_inicio IS 'Data que a programação começa a ser exibida';
COMMENT ON COLUMN public.programacao.hora_inicio IS 'Hora que a programação começa a ser exibida';
COMMENT ON COLUMN public.programacao.data_fim IS 'Data que a programação para de ser exibida';
COMMENT ON COLUMN public.programacao.hora_fim IS 'Hora que a programação para de ser exibida';

-- =========================================================
-- 3. EVENTOS - Adicionar hora fim e data fim
-- =========================================================
ALTER TABLE public.eventos
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fim TIME,
ADD COLUMN IF NOT EXISTS data_fim DATE,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS cor_categoria TEXT DEFAULT '#1A4731';

-- Migrar campo horario existente para hora_inicio
-- Formato esperado: "19h00" -> "19:00:00"
UPDATE public.eventos 
SET hora_inicio = (REPLACE(horario, 'h', ':') || ':00')::TIME
WHERE hora_inicio IS NULL AND horario IS NOT NULL AND horario ~ '^\d{1,2}h\d{2}$';

COMMENT ON COLUMN public.eventos.hora_inicio IS 'Hora de início do evento';
COMMENT ON COLUMN public.eventos.hora_fim IS 'Hora de término do evento';
COMMENT ON COLUMN public.eventos.data_fim IS 'Data final do evento (para eventos de múltiplos dias)';
COMMENT ON COLUMN public.eventos.categoria IS 'Categoria do evento (Culto, Conferência, etc)';
COMMENT ON COLUMN public.eventos.cor_categoria IS 'Cor da categoria para exibição';

-- =========================================================
-- 4. FUNÇÃO: Verificar conflito de horário
-- =========================================================
CREATE OR REPLACE FUNCTION public.verificar_conflito_devocional(
  p_data DATE,
  p_hora_inicio TIME,
  p_hora_fim TIME,
  p_id UUID DEFAULT NULL
)
RETURNS TABLE(tem_conflito BOOLEAN, devocional_conflito TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 AS tem_conflito,
    STRING_AGG(titulo, ', ') AS devocional_conflito
  FROM public.devocionais
  WHERE ativo = true
    AND data_publicacao = p_data
    AND (p_id IS NULL OR id != p_id)
    AND (
      (hora_inicio <= p_hora_inicio AND hora_fim > p_hora_inicio)
      OR (hora_inicio < p_hora_fim AND hora_fim >= p_hora_fim)
      OR (hora_inicio >= p_hora_inicio AND hora_fim <= p_hora_fim)
    );
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 5. FUNÇÃO: Obter devocional ativo atual
-- =========================================================
CREATE OR REPLACE FUNCTION public.obter_devocional_ativo()
RETURNS SETOF public.devocionais AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.devocionais
  WHERE ativo = true
    AND data_publicacao <= CURRENT_DATE
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
    AND hora_inicio <= CURRENT_TIME
    AND hora_fim >= CURRENT_TIME
  ORDER BY data_publicacao DESC, hora_inicio DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 6. FUNÇÃO: Obter programações ativas
-- =========================================================
CREATE OR REPLACE FUNCTION public.obter_programacoes_ativas()
RETURNS SETOF public.programacao AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.programacao
  WHERE ativo = true
    AND (
      data_inicio IS NULL 
      OR (data_inicio <= CURRENT_DATE AND (data_fim IS NULL OR data_fim >= CURRENT_DATE))
    )
  ORDER BY data_inicio ASC, ordem ASC;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 7. FUNÇÃO: Obter eventos ativos
-- =========================================================
CREATE OR REPLACE FUNCTION public.obter_eventos_ativos()
RETURNS SETOF public.eventos AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.eventos
  WHERE ativo = true
    AND data >= CURRENT_DATE
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  ORDER BY data ASC, hora_inicio ASC;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 8. JOB: Desativar itens expirados (executar via cron ou trigger)
-- =========================================================
CREATE OR REPLACE FUNCTION public.desativar_itens_expirados()
RETURNS void AS $$
BEGIN
  -- Desativar devocionais expirados
  UPDATE public.devocionais
  SET ativo = false, updated_at = NOW()
  WHERE ativo = true
    AND (
      (data_fim IS NOT NULL AND data_fim < CURRENT_DATE)
      OR (data_fim IS NULL AND data_publicacao < CURRENT_DATE AND hora_fim < CURRENT_TIME)
    );
    
  -- Desativar programações expiradas
  UPDATE public.programacao
  SET ativo = false, updated_at = NOW()
  WHERE ativo = true
    AND data_fim IS NOT NULL 
    AND data_fim < CURRENT_DATE;
    
  -- Desativar eventos expirados
  UPDATE public.eventos
  SET ativo = false, updated_at = NOW()
  WHERE ativo = true
    AND (
      (data_fim IS NOT NULL AND data_fim < CURRENT_DATE)
      OR (data_fim IS NULL AND data < CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- 9. Índices para performance
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_devocionais_ativo_data 
ON public.devocionais(ativo, data_publicacao, hora_inicio, hora_fim);

CREATE INDEX IF NOT EXISTS idx_programacao_ativo_data 
ON public.programacao(ativo, data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS idx_eventos_ativo_data 
ON public.eventos(ativo, data, data_fim);

-- =========================================================
-- FIM DO SCRIPT
-- =========================================================

