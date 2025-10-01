import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCampanhas } from '@/hooks/useCampanhas';
import { Send, Calendar } from 'lucide-react';

interface NovaCampanhaModalProps {
  open: boolean;
  onClose: () => void;
}

const carteirasDisponiveis = ['A', 'B', 'C', 'D', 'E', 'F'];

export function NovaCampanhaModal({ open, onClose }: NovaCampanhaModalProps) {
  const { criarCampanha, dispararCampanha } = useCampanhas();
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carteiras, setCarteiras] = useState<string[]>([]);
  const [agendamento, setAgendamento] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCarteiraToggle = (carteira: string) => {
    setCarteiras((prev) =>
      prev.includes(carteira)
        ? prev.filter((c) => c !== carteira)
        : [...prev, carteira]
    );
  };

  const handleSelecionarTodas = () => {
    if (carteiras.length === carteirasDisponiveis.length) {
      setCarteiras([]);
    } else {
      setCarteiras([...carteirasDisponiveis]);
    }
  };

  const handleSubmit = async (disparar: boolean) => {
    if (!nome || !mensagem || carteiras.length === 0) {
      return;
    }

    setLoading(true);
    const campanha = await criarCampanha({
      nome,
      mensagem,
      carteiras,
      status: disparar ? 'enviando' : 'rascunho',
      agendamento: agendamento || undefined,
    });

    if (campanha && disparar) {
      await dispararCampanha(campanha.id);
    }

    setLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setNome('');
    setMensagem('');
    setCarteiras([]);
    setAgendamento('');
    onClose();
  };

  const mensagemPreview = mensagem
    .replace('{{nome}}', 'João Silva')
    .replace('{{vendedor}}', 'Você')
    .replace('{{empresa}}', 'Empresa XYZ');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            🚀 Nova Campanha de Disparo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome da Campanha */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Campanha</Label>
            <Input
              id="nome"
              placeholder="Ex: Promoção de Fim de Ano"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              placeholder="Digite sua mensagem aqui... Use variáveis: {{nome}}, {{vendedor}}, {{empresa}}"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{'}{'{'} nome {'}'}{'}'}, {'{'}{'{'} vendedor {'}'}{'}'}, {'{'}{'{'} empresa {'}'}{'}'}
            </p>
          </div>

          {/* Preview */}
          {mensagem && (
            <div className="space-y-2">
              <Label>Preview da Mensagem</Label>
              <div className="bg-whatsapp/10 border border-whatsapp/20 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm">{mensagemPreview}</p>
              </div>
            </div>
          )}

          {/* Carteiras */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Selecionar Carteiras</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelecionarTodas}
              >
                {carteiras.length === carteirasDisponiveis.length
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {carteirasDisponiveis.map((carteira) => (
                <div key={carteira} className="flex items-center space-x-2">
                  <Checkbox
                    id={`carteira-${carteira}`}
                    checked={carteiras.includes(carteira)}
                    onCheckedChange={() => handleCarteiraToggle(carteira)}
                  />
                  <label
                    htmlFor={`carteira-${carteira}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Carteira {carteira}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Agendamento */}
          <div className="space-y-2">
            <Label htmlFor="agendamento">
              <Calendar className="w-4 h-4 inline mr-2" />
              Agendar Envio (opcional)
            </Label>
            <Input
              id="agendamento"
              type="datetime-local"
              value={agendamento}
              onChange={(e) => setAgendamento(e.target.value)}
            />
          </div>

          {/* Resumo */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Resumo do Disparo</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>📋 Nome: {nome || '-'}</li>
              <li>📊 Carteiras: {carteiras.length > 0 ? carteiras.join(', ') : '-'}</li>
              <li>⏰ Agendamento: {agendamento || 'Envio imediato'}</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={loading || !nome || !mensagem || carteiras.length === 0}
          >
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading || !nome || !mensagem || carteiras.length === 0}
            className="bg-whatsapp hover:bg-whatsapp/90"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Disparando...' : 'Disparar Agora'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
