import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, MessageSquare, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { StatusAgenteIA } from "@/components/agente-ia/StatusAgenteIA";
import { LeadsQualificadosPanel } from "@/components/agente-ia/LeadsQualificadosPanel";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadsQualificados: 0,
    conversasAtivas: 0,
    taxaConversao: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("vendedor_id", profile.id);

      const { data: conversas } = await supabase
        .from("conversas")
        .select("lead_id")
        .in("lead_id", leads?.map(l => l.id) || [])
        .eq("lida", false);

      const totalLeads = leads?.length || 0;
      const qualificados = leads?.filter(l => l.status === "qualificado").length || 0;
      const conversasAtivas = new Set(conversas?.map(c => c.lead_id)).size;
      const fechados = leads?.filter(l => l.status === "fechado").length || 0;

      setStats({
        totalLeads,
        leadsQualificados: qualificados,
        conversasAtivas,
        taxaConversao: totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu desempenho</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads em sua carteira
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.leadsQualificados}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Prontos para negociação
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-whatsapp">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-whatsapp">{stats.conversasAtivas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando resposta
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">{stats.taxaConversao}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads convertidos
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LeadsQualificadosPanel />
          </div>
          <div>
            <StatusAgenteIA />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;