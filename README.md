# 1. Navegue até a pasta do projeto

# 2. Instale as dependências
npm install

# 3. Configure o banco de dados
npm run db:push

# 4. Crie os usuários de demonstração
npx ts-node prisma/seed.ts

# 5. Inicie o servidor
npm run dev
