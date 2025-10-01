import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TipoMensagem = Database['public']['Enums']['mensagem_tipo'];

export interface Conversa {
  id: string;
  lead_id: string;
  mensagem: string;
  tipo: TipoMensagem;
  created_at?: string;
  metadata?: any;
  lida?: boolean;
}

export const useConversas = (leadId?: string) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversas = async (id?: string) => {
    const targetLeadId = id || leadId;
    if (!targetLeadId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversas')
        .select('*')
        .eq('lead_id', targetLeadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as conversas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const enviarMensagem = async (leadId: string, mensagem: string, tipo: TipoMensagem = 'enviada') => {
    try {
      const { data, error } = await supabase
        .from('conversas')
        .insert([
          {
            lead_id: leadId,
            mensagem,
            tipo,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      });

      await fetchConversas(leadId);
      return data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
        variant: 'destructive',
      });
      return null;
    }
  };

  const marcarComoLida = async (conversaId: string) => {
    try {
      const { error } = await supabase
        .from('conversas')
        .update({ lida: true })
        .eq('id', conversaId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!leadId) return;

    fetchConversas(leadId);

    const channel = supabase
      .channel(`conversas-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversas',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          setConversas((prev) => [...prev, payload.new as Conversa]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  return {
    conversas,
    loading,
    fetchConversas,
    enviarMensagem,
    marcarComoLida,
  };
};
