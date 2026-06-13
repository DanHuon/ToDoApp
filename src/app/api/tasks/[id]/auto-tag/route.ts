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

    const tagsContext = availableTags
      .map((t) => `ID: ${t.id} | Nome: ${t.name} | Descricao: ${t.description}`)
      .join('\n');

    const prompt = `
      Voce é um assistente inteligente de categorizacao de tarefas.
      Analise a tarefa abaixo e conecte uma TAG que faca sentido.
      Voce DEVE SUGERIR EXATAMENTE UMA TAG.
      Sua unica opcao e relacionar com alguma das TAGS DISPONIVEIS abaixo.
      Retorne apenas o 'existingId' da tag existente escolhida.
      Caso nenhuma se aplique, deixe vazio.

      TAREFA:
      Titulo: ${task.title}
      Descricao: ${task.description || 'Sem descricao'}

      TAGS DISPONIVEIS  (Nao repita tags que ja estao na tarefa):
      ${tagsContext || 'Nenhuma tag disponivel.'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            existingId: { type: Type.STRING, description: 'ID da tag existente escolhida. Remova este campo se nenhuma se aplicar.' },
          }
        },
      },
    });

    const parsedResponse = JSON.parse(response.text || '{}');
    
    let finalTagId = parsedResponse.existingId || null;

    if (finalTagId) {
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          tags: {
            connect: [{ id: finalTagId }],
          },
        },
        include: { tags: true },
      });
      return NextResponse.json({ success: true, task: updatedTask });
    }

    return NextResponse.json({ error: 'A IA não encontrou nenhuma tag compatível com esta tarefa' }, { status: 404 });
  } catch (error) {
    console.error('Erro no Auto-Tagging:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
