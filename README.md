# ToDo App

Este é um aplicativo de gerenciamento de tarefas construído com Next.js, Prisma e SQLite.

## Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

## Passo a passo para rodar o projeto localmente

**1. Navegue até a pasta do projeto**
Abra o seu terminal e acesse a pasta raiz do projeto.

**2. Instale as dependências**
```bash
npm install
```

**3. Configure o banco de dados**
Gere o banco SQLite e aplique as configurações (schemas):
```bash
npm run db:push
```

**4. Crie os usuários e dados de demonstração (Seed)**
```bash
npx ts-node prisma/seed.ts
```

**5. Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Após iniciar o servidor, acesse a aplicação pelo seu navegador no endereço: [http://localhost:3000](http://localhost:3000).
