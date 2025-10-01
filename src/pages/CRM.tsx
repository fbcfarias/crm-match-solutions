import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Phone, Mail, MessageSquare, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CRM = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    fetchLeads();
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("vendedor_id", profile.id)
      .order("created_at", { ascending: false });

    setLeads(data || []);
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      novo: "bg-primary/20 text-primary",
      qualificado: "bg-success/20 text-success",
      em_negociacao: "bg-warning/20 text-warning",
      fechado: "bg-chart-2/20 text-chart-2",
      perdido: "bg-destructive/20 text-destructive",
    };
    return badges[status as keyof typeof badges] || badges.novo;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      novo: "Novo",
      qualificado: "Qualificado",
      em_negociacao: "Em Negociação",
      fechado: "Fechado",
      perdido: "Perdido",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-whatsapp" />;
      case "email":
        return <Mail className="w-4 h-4 text-primary" />;
      case "telefone":
        return <Phone className="w-4 h-4 text-chart-1" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < score ? "fill-warning text-warning" : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">CRM - Gestão de Leads</h1>
            <p className="text-muted-foreground">Acompanhe e gerencie seus leads</p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            NOVO LEAD
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {lead.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{lead.nome}</CardTitle>
                      {lead.empresa && (
                        <p className="text-sm text-muted-foreground">{lead.empresa}</p>
                      )}
                    </div>
                  </div>
                  {getCanalIcon(lead.canal)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusBadge(lead.status)}>
                    {getStatusLabel(lead.status)}
                  </Badge>
                  <div className="flex gap-0.5">{renderStars(lead.score || 0)}</div>
                </div>

                {lead.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {lead.telefone}
                  </div>
                )}

                {lead.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {lead.email}
                  </div>
                )}

                {lead.ultima_interacao && (
                  <div className="text-xs text-muted-foreground">
                    Última interação:{" "}
                    {new Date(lead.ultima_interacao).toLocaleDateString("pt-BR")}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Phone className="w-4 h-4" />
                    Ligar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">Nenhum lead encontrado</h3>
              <p className="text-muted-foreground">
                Ajuste os filtros ou adicione novos leads
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CRM;