import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    const existingTag = await prisma.tag.findUnique({ where: { id: params.id } });
    if (!existingTag || existingTag.userId !== userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

    const body = await request.json();
    const { name, description } = body;
    const data: any = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Nome da tag nao pode estar vazio' }, { status: 400 });
      data.name = name.trim();
    }
    if (description !== undefined) data.description = description?.trim() || null;

    const tag = await prisma.tag.update({ where: { id: params.id }, data });
    return NextResponse.json(tag);
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao atualizar tag' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    const existingTag = await prisma.tag.findUnique({ where: { id: params.id } });
    if (!existingTag || existingTag.userId !== userId) return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });

    await prisma.tag.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao remover tag' }, { status: 500 });
  }
}
