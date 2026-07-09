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

**3. Configure as variáveis de ambiente**
Crie um arquivo chamado `.env` na raiz do projeto e adicione a seguinte linha. Essa variável é necessária para o Prisma saber onde criar e gerenciar o arquivo local do banco SQLite:
```env
DATABASE_URL="file:./dev.db"
```

**4. Configure o banco de dados**
Gere o banco SQLite e aplique as configurações (schemas):
```bash
npm run db:push
```

**5. Crie os usuários e dados de demonstração (Seed)**
```bash
npx ts-node prisma/seed.ts
```

**6. Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Após iniciar o servidor, acesse a aplicação pelo seu navegador no endereço: [http://localhost:3000](http://localhost:3000).

## Configuração de Provedores de IA (Fallback e Rotação)

A aplicação conta com um sistema inteligente que categoriza as tarefas automaticamente via Inteligência Artificial. Ele possui suporte integrado para **Google Gemini** e **Groq (Llama 3)**, com um pipeline de fallback automático (caso a cota de um provedor acabe, ele tenta o próximo da lista).

### 1. Configurar Chaves de API (.env)
Crie um arquivo `.env` na raiz do projeto (ou edite o existente) e adicione as chaves de API dos provedores que deseja utilizar. Você pode obter suas chaves nos seguintes endereços:

* **Google Gemini (AI Studio):** Acesse o [Google AI Studio API Keys](https://aistudio.google.com/app/api-keys), realize o login com sua conta Google e clique em **"Create API key"** para gerar sua chave.
* **Groq Console (Llama 3):** Acesse o [Groq Console Keys](https://console.groq.com/keys), faça o login e clique em **"Create API Key"** para gerar a chave de acesso do Groq.

Adicione as chaves correspondentes no seu arquivo `.env`:

```env
# Chave da API do Google Gemini (AI Studio)
GEMINI_API_KEY=sua_chave_gemini

# Chave da API do Llama 3 (Groq)
LLAMA_API_KEY=sua_chave_groq
```

A aplicação detecta automaticamente quais chaves estão presentes e ativa apenas os provedores configurados.

### 2. Funcionamento do Fallback e Chaves Suportadas
* O sistema tentará categorizar a tarefa usando o **Gemini** (modelo `gemini-2.5-flash`) por padrão.
* Se a requisição falhar (ex: erro de cota 429), ele tentará o provedor **Groq** (modelo `llama-3.1-8b-instant`) de forma transparente e imediata.
* Se todos os provedores configurados falharem, o app exibe uma notificação amigável na tela.

### 3. Como adicionar novos provedores ou modelos
O fluxo de autotagueamento está centralizado no endpoint [src/app/api/tasks/[id]/auto-tag/route.ts](file:///d:/Programacao/ToDoApp/ToDo-app/src/app/api/tasks/%5Bid%5D/auto-tag/route.ts). 
Para adicionar novos modelos ou provedores no futuro:
1. Crie uma função auxiliar `try[NomeDoProvedor]AutoTag(prompt, apiKey)` que retorne um array contendo os IDs das tags sugeridas.
2. Adicione o objeto do provedor contendo a chave do `.env` e a função auxiliar à lista de `providers` dentro do handler principal `POST`:
```typescript
    if (process.env.SEU_NOVO_PROVEDOR_KEY) {
      providers.push({
        name: 'Nome Do Provedor',
        apiKey: process.env.SEU_NOVO_PROVEDOR_KEY,
        fn: tryNovoProvedorAutoTag
      });
    }
```

