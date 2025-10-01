import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgenteIA } from '@/hooks/useAgenteIA';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bot } from 'lucide-react';

interface ConfigurarAgenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigurarAgenteModal = ({ open, onOpenChange }: ConfigurarAgenteModalProps) => {
  const { agente, gerarAgente, atualizarContexto } = useAgenteIA();
  const [contexto, setContexto] = useState('');
  const [estilo, setEstilo] = useState('profissional');
  const [loading, setLoading] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('contexto_agente_ia, estilo_comunicacao')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setContexto(profile.contexto_agente_ia || '');
        setEstilo(profile.estilo_comunicacao || 'profissional');
      }
    };

    if (open) {
      loadProfile();
      if (agente) {
        setPreviewPrompt(agente.prompt_personalizado.substring(0, 500) + '...');
      }
    }
  }, [open, agente]);

  const handleSalvar = async () => {
    setLoading(true);
    try {
      if (agente) {
        await atualizarContexto(contexto, estilo);
      } else {
        await gerarAgente();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {agente ? 'Configurar Agente IA' : 'Criar Agente IA'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              🤖 Seu agente IA personalizado irá atender seus leads via WhatsApp, 
              qualificá-los automaticamente e transferir para você quando estiverem prontos para comprar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contexto">
              Contexto Personalizado do Agente
            </Label>
            <Textarea
              id="contexto"
              placeholder="Exemplo: Sou especializado em projetos industriais de grande porte. Tenho 10 anos de experiência no mercado de materiais elétricos. Meu diferencial é o atendimento consultivo..."
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Descreva sua experiência, especialidades e estilo de atendimento. 
              Isso ajudará o agente a conversar de forma mais autêntica.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estilo">Estilo de Comunicação</Label>
            <Select value={estilo} onValueChange={setEstilo}>
              <SelectTrigger id="estilo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profissional">Profissional</SelectItem>
                <SelectItem value="amigavel">Amigável</SelectItem>
                <SelectItem value="consultivo">Consultivo</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define o tom das conversas do agente com os clientes
            </p>
          </div>

          {agente && previewPrompt && (
            <div className="space-y-2">
              <Label>Preview do Prompt Atual</Label>
              <div className="bg-muted rounded-lg p-3 text-xs font-mono max-h-[200px] overflow-y-auto">
                {previewPrompt}
              </div>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">⚙️ Configurações Automáticas:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✅ Score mínimo para transferência: 6 pontos</li>
              <li>✅ Máximo de mensagens sem qualificação: 5</li>
              <li>✅ Análise automática de intenção de compra</li>
              <li>✅ Notificação instantânea de leads qualificados</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {agente ? 'Atualizar Agente' : 'Criar Agente IA'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
