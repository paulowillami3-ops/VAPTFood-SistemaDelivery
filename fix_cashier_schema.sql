-- Adiciona a coluna closing_data para armazenar os detalhes do fechamento
ALTER TABLE public.cashier_sessions 
ADD COLUMN IF NOT EXISTS closing_data JSONB;

-- (Opcional) Adiciona a coluna observations caso também falte, embora pareça estar no código
ALTER TABLE public.cashier_sessions 
ADD COLUMN IF NOT EXISTS observations TEXT;
