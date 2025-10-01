import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Campanha {
  id: string;
  nome: string;
  mensagem: string;
  carteiras: string[];
  status: string;
  agendamento?: string;
  criado_por: string;
  total_enviados?: number;
  total_entregues?: number;
  total_lidos?: number;
  created_at?: string;
  updated_at?: string;
}

export const useCampanhas = () => {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCampanhas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampanhas(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar campanhas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as campanhas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const criarCampanha = async (campanhaData: Partial<Campanha>) => {
    try {
      // Buscar o profile_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('campanhas')
        .insert([{ ...campanhaData, criado_por: profile?.id }] as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Campanha criada com sucesso!',
      });

      await fetchCampanhas();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a campanha',
        variant: 'destructive',
      });
      return null;
    }
  };

  const atualizarCampanha = async (id: string, updates: Partial<Campanha>) => {
    try {
      const { error } = await supabase
        .from('campanhas')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Campanha atualizada com sucesso!',
      });

      await fetchCampanhas();
    } catch (error: any) {
      console.error('Erro ao atualizar campanha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a campanha',
        variant: 'destructive',
      });
    }
  };

  const dispararCampanha = async (campanhaId: string) => {
    try {
      // Atualizar status para "enviando"
      await atualizarCampanha(campanhaId, { status: 'enviando' });

      // TODO: Aqui você chamará a Edge Function que dispara para o N8N
      // const { data, error } = await supabase.functions.invoke('disparar-campanha', {
      //   body: { campanha_id: campanhaId }
      // });

      toast({
        title: 'Campanha Disparada',
        description: 'A campanha está sendo processada',
      });

      await fetchCampanhas();
    } catch (error: any) {
      console.error('Erro ao disparar campanha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível disparar a campanha',
        variant: 'destructive',
      });
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchCampanhas();

    const channel = supabase
      .channel('campanhas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campanhas',
        },
        (payload) => {
          console.log('Campanha atualizada em tempo real:', payload);
          fetchCampanhas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    campanhas,
    loading,
    fetchCampanhas,
    criarCampanha,
    atualizarCampanha,
    dispararCampanha,
  };
};
