-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'vendedor', 'agente');
CREATE TYPE public.carteira_type AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');
CREATE TYPE public.lead_status AS ENUM ('novo', 'qualificado', 'em_negociacao', 'fechado', 'perdido');
CREATE TYPE public.canal_type AS ENUM ('whatsapp', 'email', 'telefone', 'site');
CREATE TYPE public.campanha_status AS ENUM ('rascunho', 'agendada', 'em_execucao', 'concluida', 'cancelada');
CREATE TYPE public.mensagem_tipo AS ENUM ('enviada', 'recebida', 'sistema');

-- Create users/profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp_number TEXT,
  role user_role DEFAULT 'vendedor',
  carteira carteira_type,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id TEXT,
  vendedor_id UUID REFERENCES public.profiles(id),
  nome TEXT NOT NULL,
  empresa TEXT,
  telefone TEXT,
  email TEXT,
  status lead_status DEFAULT 'novo',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 5),
  canal canal_type DEFAULT 'whatsapp',
  ultima_interacao TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversas table
CREATE TABLE public.conversas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  mensagem TEXT NOT NULL,
  tipo mensagem_tipo NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campanhas table
CREATE TABLE public.campanhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  carteiras carteira_type[] NOT NULL,
  status campanha_status DEFAULT 'rascunho',
  agendamento TIMESTAMPTZ,
  criado_por UUID REFERENCES public.profiles(id) NOT NULL,
  total_enviados INTEGER DEFAULT 0,
  total_entregues INTEGER DEFAULT 0,
  total_lidos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create metricas table
CREATE TABLE public.metricas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendedor_id UUID REFERENCES public.profiles(id) NOT NULL,
  data DATE DEFAULT CURRENT_DATE,
  leads_gerados INTEGER DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendedor_id, data)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for leads
CREATE POLICY "Vendedores can view their leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (vendedor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendedores can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (vendedor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendedores can update their leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (vendedor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for conversas
CREATE POLICY "Users can view conversas of their leads"
  ON public.conversas FOR SELECT
  TO authenticated
  USING (lead_id IN (
    SELECT id FROM public.leads WHERE vendedor_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert conversas"
  ON public.conversas FOR INSERT
  TO authenticated
  WITH CHECK (lead_id IN (
    SELECT id FROM public.leads WHERE vendedor_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for campanhas
CREATE POLICY "Users can view all campanhas"
  ON public.campanhas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create campanhas"
  ON public.campanhas FOR INSERT
  TO authenticated
  WITH CHECK (criado_por IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their campanhas"
  ON public.campanhas FOR UPDATE
  TO authenticated
  USING (criado_por IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- RLS Policies for metricas
CREATE POLICY "Vendedores can view their metricas"
  ON public.metricas FOR SELECT
  TO authenticated
  USING (vendedor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanhas_updated_at
  BEFORE UPDATE ON public.campanhas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'vendedor')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campanhas;