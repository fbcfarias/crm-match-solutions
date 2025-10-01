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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { lead_id, mensagem } = await req.json();

    if (!lead_id || !mensagem) {
      throw new Error('lead_id e mensagem são obrigatórios');
    }

    console.log('Processando mensagem para lead:', lead_id);

    // Buscar lead e vendedor
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, profiles!leads_vendedor_id_fkey(*)')
      .eq('id', lead_id)
      .single();

    if (leadError) throw leadError;

    // Buscar agente do vendedor
    const { data: agente, error: agenteError } = await supabase
      .from('agentes_ia')
      .select('*')
      .eq('vendedor_id', lead.vendedor_id)
      .single();

    if (agenteError) throw agenteError;

    // Buscar histórico de conversas
    const { data: historico } = await supabase
      .from('conversas_ia')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Salvar mensagem do cliente
    await supabase.from('conversas_ia').insert({
      lead_id,
      agente_id: agente.id,
      mensagem,
      tipo: 'cliente',
      score_qualificacao: 0
    });

    // Montar contexto da conversa
    const contexto = montarContextoConversa(
      agente.prompt_personalizado,
      historico || [],
      lead,
      mensagem
    );

    console.log('Chamando Lovable AI com Gemini...');

    // Chamar Lovable AI (Gemini)
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: agente.prompt_personalizado },
          ...contexto
        ],
        temperature: 0.8,
        max_completion_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API Lovable AI:', aiResponse.status, errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const resposta = aiData.choices[0].message.content;

    console.log('Resposta da IA gerada:', resposta.substring(0, 100));

    // Analisar qualificação
    const analise = await analisarQualificacao(
      lovableApiKey,
      mensagem,
      historico || [],
      agente.configuracoes.threshold_transferencia || 6
    );

    console.log('Análise de qualificação:', analise);

    // Salvar resposta do agente
    await supabase.from('conversas_ia').insert({
      lead_id,
      agente_id: agente.id,
      mensagem: resposta,
      tipo: 'agente',
      score_qualificacao: analise.score,
      transferido: analise.deve_transferir,
      metadata: {
        criterios: analise.criterios_identificados,
        motivo: analise.motivo
      }
    });

    // Atualizar ou criar qualificação do lead
    const { data: qualificacaoExistente } = await supabase
      .from('qualificacao_leads')
      .select('id, score_atual')
      .eq('lead_id', lead_id)
      .maybeSingle();

    if (qualificacaoExistente) {
      const novoScore = Math.max(qualificacaoExistente.score_atual, analise.score);
      await supabase
        .from('qualificacao_leads')
        .update({
          score_atual: novoScore,
          criterios_atendidos: analise.criterios_identificados,
          status_qualificacao: analise.deve_transferir ? 'qualificado' : 'em_andamento',
          motivo_transferencia: analise.deve_transferir ? analise.motivo : null,
          transferido_em: analise.deve_transferir ? new Date().toISOString() : null
        })
        .eq('id', qualificacaoExistente.id);
    } else {
      await supabase.from('qualificacao_leads').insert({
        lead_id,
        score_atual: analise.score,
        criterios_atendidos: analise.criterios_identificados,
        status_qualificacao: analise.deve_transferir ? 'qualificado' : 'em_andamento',
        motivo_transferencia: analise.deve_transferir ? analise.motivo : null,
        transferido_em: analise.deve_transferir ? new Date().toISOString() : null
      });
    }

    // Se deve transferir, atualizar lead
    if (analise.deve_transferir) {
      await supabase
        .from('leads')
        .update({ status: 'qualificado' })
        .eq('id', lead_id);

      console.log('Lead qualificado e pronto para transferência!');
    }

    return new Response(
      JSON.stringify({
        success: true,
        resposta,
        deve_transferir: analise.deve_transferir,
        score: analise.score,
        motivo: analise.motivo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Erro ao processar mensagem:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function montarContextoConversa(
  promptBase: string,
  historico: any[],
  lead: any,
  mensagemAtual: string
): any[] {
  const mensagens: any[] = [];

  // Adicionar contexto do lead
  mensagens.push({
    role: 'system',
    content: `Informações do cliente atual:
- Nome: ${lead.nome}
- Empresa: ${lead.empresa || 'N/A'}
- Telefone: ${lead.telefone}
- Canal: ${lead.canal}
${lead.notas ? `- Notas: ${lead.notas}` : ''}`
  });

  // Adicionar histórico
  for (const msg of historico) {
    mensagens.push({
      role: msg.tipo === 'cliente' ? 'user' : 'assistant',
      content: msg.mensagem
    });
  }

  // Adicionar mensagem atual
  mensagens.push({
    role: 'user',
    content: mensagemAtual
  });

  return mensagens;
}

async function analisarQualificacao(
  lovableApiKey: string,
  mensagem: string,
  historico: any[],
  threshold: number
): Promise<any> {
  const promptAnalise = `
Analise esta conversa de vendas e determine o score de qualificação.

HISTÓRICO DA CONVERSA:
${historico.map(m => `${m.tipo}: ${m.mensagem}`).join('\n')}

ÚLTIMA MENSAGEM DO CLIENTE:
${mensagem}

CRITÉRIOS DE QUALIFICAÇÃO (pontuação):
- Projeto confirmado: +3 pontos
- Prazo definido: +2 pontos
- Orçamento disponível: +2 pontos
- Autoridade para decidir: +2 pontos
- Urgência: +1 ponto
- Interesse em orçamento: +2 pontos

SINAIS NEGATIVOS:
- "Só pesquisando": -1 ponto
- "Sem pressa": -1 ponto
- "Já tenho fornecedor": -2 pontos

Retorne APENAS um JSON válido sem markdown:
{
  "score": [número de 0 a 12],
  "deve_transferir": [true se score >= ${threshold}, false caso contrário],
  "motivo": "[explicação breve em português]",
  "criterios_identificados": ["lista de critérios encontrados"]
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: promptAnalise }
        ],
        temperature: 0.3,
        max_completion_tokens: 300
      }),
    });

    if (!response.ok) {
      throw new Error(`Análise AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Remover markdown se existir
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Erro na análise de qualificação:', error);
    return {
      score: 0,
      deve_transferir: false,
      motivo: 'Erro na análise automática',
      criterios_identificados: []
    };
  }
}
