import { Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, User, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeadCardProps {
  lead: Lead;
  onWhatsAppClick?: () => void;
  onEmailClick?: () => void;
  onChatClick?: () => void;
}

const statusColors = {
  novo: 'bg-blue-500',
  qualificado: 'bg-green-500',
  'em_negociacao': 'bg-yellow-500',
  convertido: 'bg-success',
  perdido: 'bg-destructive',
};

const canalIcons = {
  whatsapp: '📱',
  email: '📧',
  telefone: '📞',
  site: '🌐',
};

export function LeadCard({ lead, onWhatsAppClick, onEmailClick, onChatClick }: LeadCardProps) {
  const statusColor = statusColors[lead.status as keyof typeof statusColors] || 'bg-gray-500';
  const canalIcon = canalIcons[lead.canal as keyof typeof canalIcons] || '📋';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {lead.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg">{lead.nome}</h3>
              {lead.empresa && (
                <p className="text-sm text-muted-foreground">{lead.empresa}</p>
              )}
            </div>
          </div>
          <Badge className={statusColor}>
            {lead.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Informações de Contato */}
        <div className="space-y-2 text-sm">
          {lead.telefone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{lead.telefone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < lead.score
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            Score: {lead.score}/5
          </span>
        </div>

        {/* Canal */}
        <div className="flex items-center gap-2 text-sm">
          <span>{canalIcon}</span>
          <span className="text-muted-foreground capitalize">{lead.canal}</span>
        </div>

        {/* Última Interação */}
        {lead.ultima_interacao && (
          <div className="text-xs text-muted-foreground">
            Última interação:{' '}
            {new Date(lead.ultima_interacao).toLocaleDateString('pt-BR')}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-whatsapp/10 border-whatsapp/20 hover:bg-whatsapp/20"
            onClick={onWhatsAppClick}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onChatClick}
          >
            <User className="w-4 h-4 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
