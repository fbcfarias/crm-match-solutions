import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AgenteIA {
  id: string;
  vendedor_id: string;
  prompt_personalizado: string;
  configuracoes: {
    threshold_transferencia: number;
    max_mensagens_sem_qualificacao: number;
  };
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadQualificado {
  id: string;
  nome: string;
  telefone: string;
  empresa?: string;
  score_atual: number;
  status_qualificacao: string;
  motivo_transferencia?: string;
  transferido_em?: string;
  ultima_mensagem?: string;
}

export const useAgenteIA = () => {
  const [agente, setAgente] = useState<AgenteIA | null>(null);
  const [leadsQualificados, setLeadsQualificados] = useState<LeadQualificado[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgente = async () => {
    try {
      setLoading(true);
      
      // Buscar profile do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Buscar agente
      const { data, error } = await supabase
        .from('agentes_ia')
        .select('*')
        .eq('vendedor_id', profile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setAgente(data as AgenteIA | null);
    } catch (error: any) {
      console.error('Erro ao buscar agente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o agente IA',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsQualificados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Buscar leads qualificados
      const { data, error } = await supabase
        .from('qualificacao_leads')
        .select(`
          *,
          leads:lead_id (
            id,
            nome,
            telefone,
            empresa
          )
        `)
        .eq('leads.vendedor_id', profile.id)
        .eq('status_qualificacao', 'qualificado')
        .order('score_atual', { ascending: false });

      if (error) throw error;

      const leads = (data || []).map((q: any) => ({
        id: q.leads.id,
        nome: q.leads.nome,
        telefone: q.leads.telefone,
        empresa: q.leads.empresa,
        score_atual: q.score_atual,
        status_qualificacao: q.status_qualificacao,
        motivo_transferencia: q.motivo_transferencia,
        transferido_em: q.transferido_em,
      }));

      setLeadsQualificados(leads);
    } catch (error: any) {
      console.error('Erro ao buscar leads qualificados:', error);
    }
  };

  const gerarAgente = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile não encontrado');

      const { data, error } = await supabase.functions.invoke('gerar-agente-personalizado', {
        body: { vendedor_id: profile.id }
      });

      if (error) throw error;

      toast({
        title: 'Agente IA Criado',
        description: 'Seu agente personalizado foi gerado com sucesso!',
      });

      await fetchAgente();
      return data;
    } catch (error: any) {
      console.error('Erro ao gerar agente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o agente IA',
        variant: 'destructive',
      });
      return null;
    }
  };

  const atualizarContexto = async (contexto: string, estilo: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile não encontrado');

      // Atualizar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          contexto_agente_ia: contexto,
          estilo_comunicacao: estilo
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Regenerar agente com novo contexto
      await gerarAgente();

      toast({
        title: 'Contexto Atualizado',
        description: 'Seu agente IA foi atualizado com o novo contexto',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar contexto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o contexto',
        variant: 'destructive',
      });
    }
  };

  const assumirConversa = async (leadId: string) => {
    try {
      // Atualizar status para transferido
      const { error } = await supabase
        .from('qualificacao_leads')
        .update({ status_qualificacao: 'transferido' })
        .eq('lead_id', leadId);

      if (error) throw error;

      toast({
        title: 'Conversa Assumida',
        description: 'Você assumiu a conversa com este lead',
      });

      await fetchLeadsQualificados();
    } catch (error: any) {
      console.error('Erro ao assumir conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível assumir a conversa',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAgente();
    fetchLeadsQualificados();

    // Realtime para novos leads qualificados
    const channel = supabase
      .channel('qualificacao-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qualificacao_leads',
          filter: 'status_qualificacao=eq.qualificado'
        },
        () => {
          fetchLeadsQualificados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    agente,
    leadsQualificados,
    loading,
    fetchAgente,
    gerarAgente,
    atualizarContexto,
    assumirConversa,
    fetchLeadsQualificados
  };
};
