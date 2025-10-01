import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgenteIA } from '@/hooks/useAgenteIA';
import { Bot, Settings, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ConfigurarAgenteModal } from './ConfigurarAgenteModal';

export const StatusAgenteIA = () => {
  const { agente, loading, gerarAgente } = useAgenteIA();
  const [showConfig, setShowConfig] = useState(false);
  const [criando, setCriando] = useState(false);

  const handleCriarAgente = async () => {
    setCriando(true);
    try {
      await gerarAgente();
    } finally {
      setCriando(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Status do Agente IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agente ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Agente Ativo</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  Ativo
                </Badge>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score mínimo:</span>
                  <span className="font-medium">
                    {agente.configuracoes.threshold_transferencia} pontos
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite de mensagens:</span>
                  <span className="font-medium">
                    {agente.configuracoes.max_mensagens_sem_qualificacao}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última atualização:</span>
                  <span className="font-medium">
                    {new Date(agente.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowConfig(true)}
              >
                <Settings className="w-4 h-4" />
                Configurar Agente
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Agente não criado</span>
                </div>
                <Badge variant="secondary" className="bg-muted">
                  Inativo
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                Crie seu agente IA personalizado para começar a qualificar leads automaticamente 
                via WhatsApp.
              </p>

              <Button
                className="w-full gap-2"
                onClick={handleCriarAgente}
                disabled={criando}
              >
                {criando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Criar Agente IA
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ConfigurarAgenteModal 
        open={showConfig} 
        onOpenChange={setShowConfig} 
      />
    </>
  );
};
