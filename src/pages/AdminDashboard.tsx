import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, MessageSquare, Target } from "lucide-react";

interface AdminStats {
  totalVendedores: number;
  totalLeads: number;
  totalConversas: number;
  taxaConversaoGeral: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalVendedores: 0,
    totalLeads: 0,
    totalConversas: 0,
    taxaConversaoGeral: 0,
  });

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Fetch total vendedores
      const { count: vendedoresCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'vendedor');

      // Fetch total leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Fetch total conversas
      const { count: conversasCount } = await supabase
        .from('conversas_ia')
        .select('*', { count: 'exact', head: true });

      // Calculate conversion rate
      const { count: convertidosCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'fechado');

      const taxaConversao = leadsCount ? ((convertidosCount || 0) / leadsCount) * 100 : 0;

      setStats({
        totalVendedores: vendedoresCount || 0,
        totalLeads: leadsCount || 0,
        totalConversas: conversasCount || 0,
        taxaConversaoGeral: taxaConversao,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho de todos os vendedores
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVendedores}</div>
              <p className="text-xs text-muted-foreground">Ativos no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">Em todo o sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas IA</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversas}</div>
              <p className="text-xs text-muted-foreground">Total de interações</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.taxaConversaoGeral.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Média geral</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Administrativas</CardTitle>
            <CardDescription>
              Acesso completo para gerenciar vendedores e campanhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Visualizar performance de todos os vendedores
              </p>
              <p className="text-sm text-muted-foreground">
                • Criar e gerenciar campanhas de marketing
              </p>
              <p className="text-sm text-muted-foreground">
                • Acompanhar métricas consolidadas
              </p>
              <p className="text-sm text-muted-foreground">
                • Gerenciar configurações do sistema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;