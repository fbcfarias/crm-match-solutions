import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const VendedorRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    whatsapp: "",
    carteira: "A" as "A" | "B" | "C" | "D" | "E" | "F",
    contextoAgente: "",
    estiloComunicacao: "profissional"
  });

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.senha) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nome: formData.nome,
            role: 'vendedor'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // 2. Update profile with vendedor-specific data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          whatsapp_number: formData.whatsapp,
          carteira: formData.carteira,
          contexto_agente_ia: formData.contextoAgente,
          estilo_comunicacao: formData.estiloComunicacao
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      // 3. Get profile ID
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (profileFetchError) throw profileFetchError;

      // 4. Generate AI agent automatically
      const { error: agentError } = await supabase.functions.invoke('gerar-agente-personalizado', {
        body: { vendedor_id: profileData.id }
      });

      if (agentError) {
        console.error('Erro ao gerar agente:', agentError);
        toast({
          title: "Atenção",
          description: "Cadastro criado, mas houve um erro ao configurar o agente IA. Configure manualmente no dashboard.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Cadastro criado e agente IA configurado automaticamente!",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Cadastro de Vendedor</CardTitle>
          <CardDescription>
            {step === 1 ? "Passo 1: Dados Básicos" : "Passo 2: Configuração do Agente IA"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
                <Input
                  id="whatsapp"
                  placeholder="11999999999"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carteira">Carteira</Label>
                <Select
                  value={formData.carteira}
                  onValueChange={(value: "A" | "B" | "C" | "D" | "E" | "F") => 
                    setFormData({ ...formData, carteira: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Carteira A</SelectItem>
                    <SelectItem value="B">Carteira B</SelectItem>
                    <SelectItem value="C">Carteira C</SelectItem>
                    <SelectItem value="D">Carteira D</SelectItem>
                    <SelectItem value="E">Carteira E</SelectItem>
                    <SelectItem value="F">Carteira F</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Próximo: Configurar Agente IA
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contexto">Contexto do Agente IA</Label>
                <Textarea
                  id="contexto"
                  placeholder="Descreva seu estilo de vendas, principais produtos, diferenciais..."
                  value={formData.contextoAgente}
                  onChange={(e) => setFormData({ ...formData, contextoAgente: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estilo">Estilo de Comunicação</Label>
                <Select
                  value={formData.estiloComunicacao}
                  onValueChange={(value: string) => 
                    setFormData({ ...formData, estiloComunicacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="consultivo">Consultivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorRegister;