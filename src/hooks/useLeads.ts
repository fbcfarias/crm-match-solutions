import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type LeadStatus = Database['public']['Enums']['lead_status'];
type CanalType = Database['public']['Enums']['canal_type'];

export interface Lead {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  vendedor_id?: string;
  status: LeadStatus;
  score: number;
  canal: CanalType;
  ultima_interacao?: string;
  created_at?: string;
  updated_at?: string;
  cliente_id?: string;
  notas?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async (filtros?: any) => {
    try {
      setLoading(true);
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros?.canal) {
        query = query.eq('canal', filtros.canal);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const criarLead = async (leadData: Partial<Lead>) => {
    try {
      // Buscar o profile_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile não encontrado');

      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, vendedor_id: profile.id } as any])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead criado com sucesso!',
      });

      await fetchLeads();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o lead',
        variant: 'destructive',
      });
      return null;
    }
  };

  const atualizarLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso!',
      });

      await fetchLeads();
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o lead',
        variant: 'destructive',
      });
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Lead atualizado em tempo real:', payload);
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    leads,
    loading,
    fetchLeads,
    criarLead,
    atualizarLead,
  };
};
