import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Decode token and get userId
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = decoded.split(':')[0]

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask || existingTask.userId !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, completed, dueDate, tagIds } = body

    const data: any = {}

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ error: 'Título não pode estar vazio' }, { status: 400 })
      }
      data.title = title.trim()
    }

    if (description !== undefined) {
      data.description = description?.trim() || null
    }

    if (completed !== undefined) {
      data.completed = completed
    }

    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null
    }

    if (tagIds !== undefined && Array.isArray(tagIds)) {
      data.tags = {
        set: tagIds.map((id: string) => ({ id }))
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: { tags: true }
    })

    return NextResponse.json(task)
  } catch {
    return NextResponse.json({ error: 'Falha ao atualizar tarefa' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Decode token and get userId
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const userId = decoded.split(':')[0]

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask || existingTask.userId !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Falha ao remover tarefa' }, { status: 500 })
  }
}
