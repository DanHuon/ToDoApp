import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    const tags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao carregar tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    const body = await request.json();
    const { name, description } = body;
    
    if (!name || name.trim() === '') return NextResponse.json({ error: 'Nome da tag e obrigatorio' }, { status: 400 });

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
      },
    });
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao criar tag' }, { status: 500 });
  }
}
