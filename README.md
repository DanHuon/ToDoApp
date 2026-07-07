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

## Configuração de IA e Modelos de Linguagem

A aplicação conta com um sistema inteligente que categoriza as tarefas automaticamente via Inteligência Artificial. Para habilitar ou personalizar esta função, siga os passos abaixo:

### 1. Definir a Chave de API
Crie um arquivo `.env` na raiz do projeto (ou edite o existente) e configure a sua chave de API de IA de preferência usando a variável universal `AI_API_KEY`:
```env
AI_API_KEY=sua_chave_aqui
```

### 2. Personalizar o Modelo de IA
Por padrão, a aplicação utiliza a API do Gemini com o modelo rápido **`gemini-2.5-flash`**. Caso deseje alterar para outro modelo (como o `gemini-2.5-pro` ou outro modelo de preferência), siga estas instruções:

1. Abra o arquivo [auto-tag/route.ts](file:///d:/Programacao/ToDoApp/ToDo-app/src/app/api/tasks/%5Bid%5D/auto-tag/route.ts).
2. Localize a chamada `ai.models.generateContent` (aproximadamente na linha 54) e altere a propriedade `model`:

```diff
     const response = await ai.models.generateContent({
-      model: 'gemini-2.5-flash',
+      model: 'gemini-2.5-pro', // Insira o modelo de sua preferência aqui
       contents: prompt,
```
3. Salve o arquivo e a aplicação aplicará a mudança automaticamente em tempo de execução.

