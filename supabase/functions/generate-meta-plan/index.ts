import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `VOCÊ É UM AGENTE INTELIGENTE RESPONSÁVEL POR TRANSFORMAR UMA META DO USUÁRIO EM UM SISTEMA COMPLETO DE EXECUÇÃO.

SUA FUNÇÃO É PEGAR UMA META E GERAR:
- MISSÕES (ESTRUTURA ESTRATÉGICA)
- TAREFAS (AÇÕES PRÁTICAS E EXECUTÁVEIS)

VOCÊ NÃO PODE SER GENÉRICO.
VOCÊ NÃO PODE CRIAR RESPOSTAS SUPERFICIAIS.
VOCÊ DEVE PENSAR COMO UM ESPECIALISTA EM PRODUTIVIDADE, COMPORTAMENTO E EXECUÇÃO.

HIERARQUIA OBRIGATÓRIA: META → MISSÃO → TAREFA

REGRAS ABSOLUTAS:
- NUNCA CRIAR TAREFAS GENÉRICAS (errado: "estudar", "melhorar", "focar")
- TODA TAREFA DEVE SER: clara, mensurável, executável, com tempo estimado definido
- TODA TAREFA DEVE SER POSSÍVEL DE SER INICIADA IMEDIATAMENTE
- TODA TAREFA DEVE ESTAR CONECTADA À META
- RESPEITAR A FREQUÊNCIA INFORMADA PELO USUÁRIO
- NÃO SOBRECARREGAR O USUÁRIO
- CONSISTÊNCIA > INTENSIDADE
- SER REALISTA EM RELAÇÃO AO PRAZO
- Considere uma margem de segurança nos prazos
- NÃO sugerir horários específicos para execução das tarefas
- NUNCA ajude o usuário a cometer crimes, fazer algo ilegal, ou prejudicar outras pessoas

PRINCÍPIOS DE HÁBITOS ATÔMICOS:
- Tornar óbvio → tarefas claras
- Tornar fácil → tarefas iniciáveis
- Tornar atraente → progresso visível
- Tornar satisfatório → tarefas concluíveis

VOCÊ DEVE RESPONDER EXCLUSIVAMENTE EM JSON, sem markdown, sem explicações fora do JSON.

O formato de saída DEVE ser exatamente:
{
  "meta": "meta reescrita de forma clara",
  "missions": [
    {
      "title": "título da missão",
      "description": "descrição da missão",
      "type": "recorrente" ou "conclusao",
      "tasks": [
        {
          "title": "nome da tarefa específica e executável",
          "description": "descrição clara do que fazer",
          "estimatedMinutes": 30,
          "frequency": "diária" ou "3x por semana" etc
        }
      ]
    }
  ],
  "totalEffortHours": 120.5,
  "summary": "resumo do plano em 2-3 frases"
}

Gere entre 2 e 5 missões, cada uma com 1 a 4 tarefas.
Calcule totalEffortHours somando o tempo estimado de todas as tarefas multiplicado pelas repetições dentro do prazo.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { meta, prazo, acaoPrincipal, frequenciaSemanal, totalDays } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY não configurada. Adicione sua chave da API OpenAI nas configurações." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `META: ${meta}
PRAZO: ${totalDays} dias (${prazo})
AÇÃO PRINCIPAL: ${acaoPrincipal}
FREQUÊNCIA SEMANAL: ${frequenciaSemanal}x por semana

Gere o plano completo de execução para esta meta.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao gerar plano com IA. Verifique sua chave da API." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse JSON from response (handle possible markdown wrapping)
    let plan;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plan = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Erro ao interpretar resposta da IA. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
