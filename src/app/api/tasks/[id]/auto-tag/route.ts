import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper para chamada ao Google Gemini
async function tryGeminiAutoTag(prompt: string, apiKey: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          existingIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de IDs das tags existentes escolhidas.'
          }
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || '{}');
  return Array.isArray(parsed.existingIds) ? parsed.existingIds : [];
}

// Helper para chamada ao Groq (Llama-3.1-8b-instant)
async function tryGroqAutoTag(prompt: string, apiKey: string): Promise<string[]> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (status ${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return Array.isArray(parsed.existingIds) ? parsed.existingIds : [];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { tags: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa nao encontrada' }, { status: 404 });
    }

    const allUserTags = await prisma.tag.findMany({
      where: { userId: task.userId },
    });

    const currentTagIds = task.tags.map(t => t.id);
    const availableTags = allUserTags.filter(t => !currentTagIds.includes(t.id));

    if (availableTags.length === 0) {
      return NextResponse.json({ error: 'Todas as tags disponíveis já foram vinculadas a esta tarefa' }, { status: 400 });
    }

    const tagsContext = availableTags
      .map((t) => `ID: ${t.id} | Nome: ${t.name} | Descricao: ${t.description}`)
      .join('\n');

    const prompt = `
      Voce é um assistente de IA extremamente conservador e rigoroso para categorizacao de tarefas.
      Sua tarefa é analisar o Titulo e a Descricao da tarefa fornecida e associar apenas as TAGS que possuam uma relacao DIRETA, OBVIA e INQUESTIONAVEL.

      DIRETRIZES DE DECISAO OBRIGATORIAS:
      1. NAO FAÇA associações indiretas. Não crie justificativas mentais nem dê saltos lógicos para tentar encaixar uma tag (por exemplo: NÃO associe a tag "Saúde" ao ato de "Jogar o lixo fora" ou a tag "Faculdade" a "Comprar caneta", a menos que a descrição explicite essa correlação direta).
      2. Seja extremamente conservador. Retornar o array "existingIds" vazio (ex: {"existingIds": []}) é o comportamento correto, esperado e recomendado caso não haja um "match" perfeito.
      3. Limite de quantidade: Retorne no máximo até 2 tags por requisição.
      
      Sua única opção é relacionar com alguma(s) das TAGS DISPONIVEIS abaixo.
      
      Retorne obrigatoriamente um objeto JSON com a seguinte estrutura:
      {
        "existingIds": ["id_da_tag1", "id_da_tag2"]
      }

      TAREFA:
      Titulo: ${task.title}
      Descricao: ${task.description || 'Sem descricao'}

      TAGS DISPONIVEIS (Nao repita tags que ja estao na tarefa):
      ${tagsContext}
    `;

    // Monta a lista de provedores ativos com base nas chaves no .env
    const providers = [];

    // Suporta tanto GEMINI_API_KEY quanto a variável anterior AI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (geminiKey) {
      providers.push({
        name: 'Gemini (Google)',
        apiKey: geminiKey,
        fn: tryGeminiAutoTag
      });
    }

    if (process.env.LLAMA_API_KEY) {
      providers.push({
        name: 'Llama 3 (Groq)',
        apiKey: process.env.LLAMA_API_KEY,
        fn: tryGroqAutoTag
      });
    }

    if (providers.length === 0) {
      return NextResponse.json({
        error: 'Nenhuma chave de API de IA configurada. Defina GEMINI_API_KEY ou LLAMA_API_KEY no arquivo .env.'
      }, { status: 400 });
    }

    let suggestedIds: string[] = [];
    let executedSuccessfully = false;
    const errors: string[] = [];

    for (const provider of providers) {
      try {
        console.log(`[AutoTag] Tentando provedor: ${provider.name}...`);
        suggestedIds = await provider.fn(prompt, provider.apiKey);
        executedSuccessfully = true;
        console.log(`[AutoTag] Sucesso com ${provider.name}. Sugestões:`, suggestedIds);
        break; // Sucesso com o provedor, interrompe o loop
      } catch (err: any) {
        console.error(`[AutoTag] Falha com o provedor ${provider.name}:`, err.message || err);
        errors.push(`${provider.name}: ${err.message || err}`);
      }
    }

    if (!executedSuccessfully) {
      const isRateLimit = errors.some(e =>
        e.includes('429') ||
        e.toLowerCase().includes('quota') ||
        e.toLowerCase().includes('limit')
      );

      if (isRateLimit) {
        return NextResponse.json({
          error: 'Limite de cota excedido em todos os provedores de IA configurados. Por favor, tente novamente mais tarde.'
        }, { status: 429 });
      }

      return NextResponse.json({
        error: `Falha ao processar autotagueamento nos provedores de IA. Detalhes: ${errors.join(', ')}`
      }, { status: 500 });
    }

    // Validar se as tags sugeridas realmente existem entre as tags disponíveis do usuário
    const validTagIds = suggestedIds.filter(id => availableTags.some(t => t.id === id));

    if (validTagIds.length > 0) {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          tags: {
            connect: validTagIds.map(id => ({ id })),
          },
        },
        include: { tags: true },
      });
      return NextResponse.json({ success: true, task: updatedTask });
    }

    return NextResponse.json({ error: 'A IA não encontrou nenhuma nova tag compatível com esta tarefa' }, { status: 404 });
  } catch (error) {
    console.error('Erro no Auto-Tagging:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
