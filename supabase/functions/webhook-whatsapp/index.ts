import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Webhook WhatsApp recebido:', JSON.stringify(body));

    // Extrair dados do webhook (formato pode variar conforme provedor)
    const { telefone, mensagem, instance_id } = body;

    if (!telefone || !mensagem) {
      console.log('Webhook ignorado: dados incompletos');
      return new Response(
        JSON.stringify({ success: true, message: 'Dados incompletos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Mensagem de ${telefone}: ${mensagem}`);

    // Buscar lead pelo telefone
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, qualificacao_leads(*)')
      .eq('telefone', telefone)
      .maybeSingle();

    if (leadError) {
      console.error('Erro ao buscar lead:', leadError);
      throw leadError;
    }

    if (!lead) {
      console.log('Lead não encontrado para telefone:', telefone);
      return new Response(
        JSON.stringify({ success: true, message: 'Lead não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Verificar se já foi transferido para vendedor
    const jaTransferido = lead.qualificacao_leads?.[0]?.status_qualificacao === 'transferido';

    if (jaTransferido) {
      console.log('Lead já transferido, não processar com IA');
      return new Response(
        JSON.stringify({ success: true, message: 'Lead já transferido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Processar mensagem com agente IA
    console.log('Processando mensagem com agente IA...');
    
    const processarResponse = await fetch(`${supabaseUrl}/functions/v1/processar-mensagem-ia`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_id: lead.id,
        mensagem
      })
    });

    if (!processarResponse.ok) {
      const errorText = await processarResponse.text();
      console.error('Erro ao processar mensagem:', errorText);
      throw new Error('Erro ao processar com IA');
    }

    const resultado = await processarResponse.json();
    console.log('Resultado do processamento:', resultado);

    // TODO: Enviar resposta via WhatsApp API (Z-API, Meta Business, etc)
    // Exemplo:
    // await enviarMensagemWhatsApp(telefone, resultado.resposta, instance_id);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        resposta_enviada: resultado.resposta,
        deve_transferir: resultado.deve_transferir,
        score: resultado.score
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
