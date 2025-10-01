import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const carteiras = ["A", "B", "C", "D", "E", "F"];

const Campanhas = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    mensagem: "",
    carteiras: [] as string[],
    agendamento: "",
  });

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const fetchCampanhas = async () => {
    const { data } = await supabase
      .from("campanhas")
      .select("*")
      .order("created_at", { ascending: false });
    
    setCampanhas(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      toast.error("Perfil não encontrado");
      return;
    }

    const { error } = await supabase.from("campanhas").insert([{
      nome: formData.nome,
      mensagem: formData.mensagem,
      carteiras: formData.carteiras as any,
      agendamento: formData.agendamento || null,
      criado_por: profile.id,
      status: formData.agendamento ? ("agendada" as const) : ("rascunho" as const),
    }]);

    if (error) {
      toast.error("Erro ao criar campanha");
      return;
    }

    toast.success("Campanha criada com sucesso!");
    setOpen(false);
    setFormData({ nome: "", mensagem: "", carteiras: [], agendamento: "" });
    fetchCampanhas();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      rascunho: "bg-muted text-muted-foreground",
      agendada: "bg-warning/20 text-warning",
      em_execucao: "bg-primary/20 text-primary",
      concluida: "bg-success/20 text-success",
      cancelada: "bg-destructive/20 text-destructive",
    };
    return badges[status as keyof typeof badges] || badges.rascunho;
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Campanhas</h1>
            <p className="text-muted-foreground">Gerencie suas campanhas de disparo</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                NOVA CAMPANHA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Campanha</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Promoção Black Friday"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    placeholder="Digite sua mensagem aqui... Use {{nome}} para personalizar"
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Variáveis disponíveis: {"{{nome}}"}, {"{{empresa}}"}, {"{{vendedor}}"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Selecionar Carteiras</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {carteiras.map((carteira) => (
                      <div key={carteira} className="flex items-center space-x-2">
                        <Checkbox
                          id={`carteira-${carteira}`}
                          checked={formData.carteiras.includes(carteira)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                carteiras: [...formData.carteiras, carteira],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                carteiras: formData.carteiras.filter((c) => c !== carteira),
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`carteira-${carteira}`} className="cursor-pointer">
                          Carteira {carteira}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agendamento">Agendamento (Opcional)</Label>
                  <Input
                    id="agendamento"
                    type="datetime-local"
                    value={formData.agendamento}
                    onChange={(e) => setFormData({ ...formData, agendamento: e.target.value })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 gap-2">
                    <Send className="w-4 h-4" />
                    {formData.agendamento ? "AGENDAR" : "SALVAR RASCUNHO"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campanhas.map((campanha) => (
            <Card key={campanha.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{campanha.nome}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(
                      campanha.status
                    )}`}
                  >
                    {campanha.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {campanha.mensagem}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(campanha.created_at).toLocaleDateString("pt-BR")}
                </div>
                <div className="flex gap-1">
                  {campanha.carteiras.map((c: string) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Enviados</p>
                    <p className="text-sm font-semibold">{campanha.total_enviados}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entregues</p>
                    <p className="text-sm font-semibold">{campanha.total_entregues}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lidos</p>
                    <p className="text-sm font-semibold">{campanha.total_lidos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {campanhas.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Send className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <h3 className="text-xl font-semibold">Nenhuma campanha criada</h3>
              <p className="text-muted-foreground">
                Clique no botão "NOVA CAMPANHA" para começar
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Campanhas;