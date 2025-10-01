import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAgenteIA } from '@/hooks/useAgenteIA';
import { Phone, Building2, Star, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LeadsQualificadosPanel = () => {
  const { leadsQualificados, loading, assumirConversa } = useAgenteIA();
  const [assumindo, setAssumindo] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAssumir = async (leadId: string) => {
    setAssumindo(leadId);
    try {
      await assumirConversa(leadId);
      navigate('/chat', { state: { leadId } });
    } finally {
      setAssumindo(null);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (score >= 6) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (leadsQualificados.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhum lead qualificado</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Quando o agente IA qualificar leads automaticamente, eles aparecerão aqui 
            para você assumir a conversa.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Leads Qualificados pelo Agente IA
        </h2>
        <Badge variant="secondary">
          {leadsQualificados.length} {leadsQualificados.length === 1 ? 'lead' : 'leads'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {leadsQualificados.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{lead.nome}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {lead.telefone}
                    </span>
                    {lead.empresa && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {lead.empresa}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={getScoreBadgeColor(lead.score_atual)}>
                  {lead.score_atual} pts
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {lead.motivo_transferencia && (
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-sm">
                    <strong>Motivo da qualificação:</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.motivo_transferencia}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Qualificado em:</span>
                <span>
                  {lead.transferido_em 
                    ? new Date(lead.transferido_em).toLocaleString('pt-BR')
                    : 'Agora'
                  }
                </span>
              </div>

              <Button
                onClick={() => handleAssumir(lead.id)}
                disabled={assumindo === lead.id}
                className="w-full gap-2"
              >
                {assumindo === lead.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assumindo...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Assumir Conversa
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
