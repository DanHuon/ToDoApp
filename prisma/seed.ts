import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashPassword('admin123'),
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  console.log('Admin user created:', admin)

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashPassword('user123'),
      name: 'Regular User',
      role: 'USER',
    },
  })

  console.log('Regular user created:', user)

  // Create sample tags for the regular user
  const tagEstudos = await prisma.tag.create({
    data: { name: 'Estudos', description: 'Tarefas relacionadas a cursos, faculdade e aprendizado', userId: user.id }
  })
  const tagSaude = await prisma.tag.create({
    data: { name: 'Saúde', description: 'Exercícios físicos, médicos e bem-estar', userId: user.id }
  })
  console.log('Sample tags created')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  // Create some sample tasks for the regular user
  const task1 = await prisma.task.create({
    data: {
      title: 'Aprender Next.js',
      description: 'Completar o tutorial de Next.js e criar um projeto',
      completed: true,
      userId: user.id,
      dueDate: tomorrow,
      tags: {
        connect: [{ id: tagEstudos.id }]
      }
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Estudar TypeScript',
      description: 'Revisar tipos genéricos e decoradores',
      completed: false,
      userId: user.id,
      dueDate: nextWeek,
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Fazer exercício',
      description: 'Treinar na academia por 1 hora',
      completed: false,
      userId: user.id,
      dueDate: tomorrow,
    },
  })

  console.log('Sample tasks created')
  console.log('\nSeed completed!')
  console.log('\nDemo Credentials:')
  console.log('Admin - email: admin@example.com, password: admin123')
  console.log('User - email: user@example.com, password: user123')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
