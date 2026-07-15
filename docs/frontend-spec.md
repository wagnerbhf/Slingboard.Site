# Frontend Specification — Slingboard (Angular)

> Adaptado do spec original (que previa React) para Angular. A UX/fluxos descritos são os mesmos; só a implementação técnica muda.

## 1. Roteamento

- `/login`, `/register`
- `/boards` → Dashboard (lista de boards do usuário)
- `/boards/:boardId` → Visualização do Kanban
- `/boards/:boardId/settings` → Configurações do board
- Guard de autenticação (`canActivate`) em todas as rotas exceto `/login` e `/register`

## 2. Telas e Componentes

### Login / Register

- Formulários reativos com validação em tempo real (mesmas regras do backend: senha mín. 8 caracteres, maiúscula, número, símbolo)
- Chamar `POST /api/v1/auth/register` depois `POST /api/v1/auth/login` automaticamente após registro bem-sucedido (UX: já loga o usuário)
- Mensagens de erro específicas: 409 → "Este email já está cadastrado", 401 → "Email ou senha inválidos"

### Dashboard (`/boards`)

- Grid de cards de board: título, descrição, `taskCount`, `memberCount`, cor de fundo (`backgroundColor`)
- Busca por título (`GET /api/v1/boards?search=`) com debounce
- Botão "Criar Board" → modal/dialog com título, descrição, cor

### Kanban Board (`/boards/:boardId`)

- Header: título do board (editável inline via `PUT`), avatar stack de membros, botão de export, botão de configurações
- Colunas horizontais scrolláveis, cada uma com:
  - Título, contador de tasks, WIP limit (se configurado) — destacar visualmente se número de tasks > limit
  - Lista de `TaskCard`s ordenados por `order`
  - Botão "+" para criar task rápida direto na coluna
- Drag & drop com Angular CDK:
  - Entre colunas → chama `PATCH /api/v1/tasks/{id}/move` com `newColumnId` + `newOrder`
  - Reordenar na mesma coluna → mesmo endpoint, só `newOrder` muda
  - Optimistic update: mover visualmente antes da resposta do servidor; reverter com toast de erro se falhar
- Realtime: ao entrar na tela, `JoinBoard(boardId)`; ao sair, `LeaveBoard(boardId)`. Escutar todos os eventos da tabela em `api-contract.md` e atualizar o estado local (signals) de acordo — cuidado para não duplicar a atualização quando o próprio usuário é o autor da ação (já fez optimistic update).

### TaskCard

- Título, preview da descrição (2-3 linhas), badges de labels (cores reais do backend), ícone/cor de prioridade, avatar do assignee, badge de due date (amarelo se próximo, vermelho se atrasado)
- Click abre o `TaskModal`

### TaskModal (criar/editar)

- Campos: título, descrição, prioridade (`PrioritySelector`), due date, labels (`LabelSelector` multi-select), assignee (dropdown de membros do board)
- Salvar chama `PUT /api/v1/tasks/{id}` (edição) ou `POST /api/v1/boards/{boardId}/tasks` (criação)

### FiltersBar

- Filtros por prioridade, label(s), assignee, intervalo de data — todos mapeiam direto pros query params de `GET /api/v1/boards/{boardId}/tasks`

### LabelsManagerModal

- CRUD de labels do board (`GET/POST/PUT/DELETE /api/v1/boards/{boardId}/labels` e `/api/v1/labels/{id}`)
- Preview de cor em tempo real ao editar

### MembersManager

- Lista membros atuais com roles
- Adicionar membro: campo de busca com debounce chamando `GET /api/v1/users?search=`, exibindo resultados num dropdown/autocomplete; ao selecionar, chama `POST /api/v1/boards/{boardId}/members` com o `userId` escolhido

### ExportModal

- Escolher formato (CSV/PDF), incluir concluídas (checkbox), filtro de data
- Chama `GET /api/v1/boards/{boardId}/export?...` e dispara download do blob retornado

## 3. Estado (sugestão de organização com Signals)

- **AuthService**: signal com usuário atual + accessToken em memória
- **BoardStore** (por feature): signals para board atual, colunas, tasks, labels, membros — atualizados tanto por resposta HTTP quanto por eventos SignalR
- **RealtimeService**: encapsula a conexão SignalR, expõe um jeito de "escutar" eventos e disparar callbacks que atualizam os signals acima

## 4. Interceptors HTTP necessários

1. **Auth Interceptor**: injeta `Authorization: Bearer {accessToken}` em toda request pra API
2. **Refresh Interceptor**: em caso de 401, tenta `POST /api/v1/auth/refresh`, atualiza o token em memória, repete a request original; se o refresh também falhar, redireciona pro login
3. **Error Interceptor**: centraliza tratamento de erros (mapear `{ title, status }` do backend pra toasts consistentes)

## 5. Itens em aberto / decisões pendentes para a primeira sessão

- Confirmar versão exata do Angular disponível no momento de iniciar
- Escolher biblioteca de componentes UI (Angular Material vs headless + Tailwind)
- Definir se CORS será resolvido no backend antes ou durante o desenvolvimento do frontend
