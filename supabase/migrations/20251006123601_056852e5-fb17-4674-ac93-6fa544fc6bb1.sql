-- ================================================
-- MIGRATION: Sistema Seguro de Roles (CORRIGIDO)
-- ================================================

-- 1. Criar ENUM para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor', 'agente');

-- 2. Criar tabela user_roles (separada e segura)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar índices para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 5. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only system can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (false);

CREATE POLICY "Only system can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (false);

-- 6. Funções SECURITY DEFINER para verificação segura
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 7. Migrar dados existentes de profiles.role para user_roles
-- Converter user_role para text e depois para app_role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id, 
  CASE role::text
    WHEN 'admin' THEN 'admin'::app_role
    WHEN 'vendedor' THEN 'vendedor'::app_role
    WHEN 'agente' THEN 'agente'::app_role
  END as role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Atualizar trigger handle_new_user para usar user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _role_text text;
BEGIN
  -- Pegar role do metadata
  _role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'vendedor');
  
  -- Converter para app_role
  _role := CASE _role_text
    WHEN 'admin' THEN 'admin'::app_role
    WHEN 'vendedor' THEN 'vendedor'::app_role
    WHEN 'agente' THEN 'agente'::app_role
    ELSE 'vendedor'::app_role
  END;
  
  -- Inserir profile SEM role
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email
  );
  
  -- Inserir role na tabela segura
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;

-- 9. Remover coluna role de profiles (agora obsoleta)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 10. Criar view helper para facilitar queries
CREATE OR REPLACE VIEW public.profiles_with_roles AS
SELECT 
  p.*,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id;

-- 11. Atualizar RLS policies existentes para usar has_role()

-- AGENTES_IA
DROP POLICY IF EXISTS "Vendedores podem ver seu próprio agente" ON public.agentes_ia;
DROP POLICY IF EXISTS "Vendedores podem criar seu agente" ON public.agentes_ia;
DROP POLICY IF EXISTS "Vendedores podem atualizar seu agente" ON public.agentes_ia;

CREATE POLICY "Vendedores podem ver seu próprio agente"
  ON public.agentes_ia
  FOR SELECT
  USING (
    vendedor_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendedores podem criar seu agente"
  ON public.agentes_ia
  FOR INSERT
  WITH CHECK (
    vendedor_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Vendedores podem atualizar seu agente"
  ON public.agentes_ia
  FOR UPDATE
  USING (
    vendedor_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- CAMPANHAS (apenas admins)
DROP POLICY IF EXISTS "Users can create campanhas" ON public.campanhas;
DROP POLICY IF EXISTS "Users can update their campanhas" ON public.campanhas;
DROP POLICY IF EXISTS "Users can view all campanhas" ON public.campanhas;

CREATE POLICY "Admins can create campanhas"
  ON public.campanhas
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update campanhas"
  ON public.campanhas
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all campanhas"
  ON public.campanhas
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- PROFILES - remover política insegura de update
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile data"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);