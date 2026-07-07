import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      Voce é um assistente inteligente de categorizacao de tarefas.
      Analise a tarefa abaixo e conecte todas as TAGS que facam sentido.
      Sua unica opcao e relacionar com alguma(s) das TAGS DISPONIVEIS abaixo.
      Retorne uma lista com os 'existingIds' das tags existentes escolhidas.
      Caso nenhuma se aplique, retorne uma lista vazia.

      TAREFA:
      Titulo: ${task.title}
      Descricao: ${task.description || 'Sem descricao'}

      TAGS DISPONIVEIS (Nao repita tags que ja estao na tarefa):
      ${tagsContext}
    `;

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
              description: 'Lista de IDs das tags existentes escolhidas que fazem sentido para a tarefa.'
            },
          }
        },
      },
    });

    const parsedResponse = JSON.parse(response.text || '{}');
    const suggestedIds: string[] = Array.isArray(parsedResponse.existingIds)
      ? parsedResponse.existingIds
      : [];

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

    if (error && typeof error === 'object') {
      const err = error as any;
      const isRateLimit =
        err.status === 429 ||
        (err.message && (
          err.message.includes('429') ||
          err.message.toLowerCase().includes('quota') ||
          err.message.toLowerCase().includes('limit')
        ));

      if (isRateLimit) {
        return NextResponse.json({
          error: 'Limite de requisições/cota da chave de API excedido. Por favor, aguarde um momento antes de tentar novamente.'
        }, { status: 429 });
      }
    }

    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
