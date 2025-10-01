-- Adicionar campo de contexto personalizado na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contexto_agente_ia TEXT,
ADD COLUMN IF NOT EXISTS estilo_comunicacao TEXT DEFAULT 'profissional',
ADD COLUMN IF NOT EXISTS agente_ativo BOOLEAN DEFAULT TRUE;

-- Criar tabela para configuração dos agentes IA
CREATE TABLE IF NOT EXISTS public.agentes_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_personalizado TEXT NOT NULL,
  configuracoes JSONB DEFAULT '{"threshold_transferencia": 6, "max_mensagens_sem_qualificacao": 5}'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendedor_id)
);

-- Criar tabela para conversas processadas pela IA
CREATE TABLE IF NOT EXISTS public.conversas_ia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agente_id UUID NOT NULL REFERENCES public.agentes_ia(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'agente', 'vendedor')),
  score_qualificacao INTEGER DEFAULT 0,
  transferido BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para qualificação de leads
CREATE TABLE IF NOT EXISTS public.qualificacao_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score_atual INTEGER DEFAULT 0,
  criterios_atendidos JSONB DEFAULT '{}'::jsonb,
  status_qualificacao TEXT DEFAULT 'em_andamento' CHECK (status_qualificacao IN ('em_andamento', 'qualificado', 'descualificado', 'transferido')),
  motivo_transferencia TEXT,
  transferido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversas_ia_lead_id ON public.conversas_ia(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversas_ia_agente_id ON public.conversas_ia(agente_id);
CREATE INDEX IF NOT EXISTS idx_conversas_ia_created_at ON public.conversas_ia(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qualificacao_leads_status ON public.qualificacao_leads(status_qualificacao);
CREATE INDEX IF NOT EXISTS idx_qualificacao_leads_score ON public.qualificacao_leads(score_atual DESC);

-- Enable RLS
ALTER TABLE public.agentes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualificacao_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies para agentes_ia
CREATE POLICY "Vendedores podem ver seu próprio agente"
  ON public.agentes_ia FOR SELECT
  USING (vendedor_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Vendedores podem criar seu agente"
  ON public.agentes_ia FOR INSERT
  WITH CHECK (vendedor_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Vendedores podem atualizar seu agente"
  ON public.agentes_ia FOR UPDATE
  USING (vendedor_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies para conversas_ia
CREATE POLICY "Vendedores podem ver conversas de seus leads"
  ON public.conversas_ia FOR SELECT
  USING (lead_id IN (
    SELECT l.id FROM public.leads l
    WHERE l.vendedor_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Sistema pode inserir conversas"
  ON public.conversas_ia FOR INSERT
  WITH CHECK (true);

-- RLS Policies para qualificacao_leads
CREATE POLICY "Vendedores podem ver qualificação de seus leads"
  ON public.qualificacao_leads FOR SELECT
  USING (lead_id IN (
    SELECT l.id FROM public.leads l
    WHERE l.vendedor_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Sistema pode gerenciar qualificação"
  ON public.qualificacao_leads FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agentes_ia_updated_at
  BEFORE UPDATE ON public.agentes_ia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qualificacao_leads_updated_at
  BEFORE UPDATE ON public.qualificacao_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();