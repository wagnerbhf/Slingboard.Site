# API Contract — Slingboard (real, como implementado)

> Este documento reflete o que foi **efetivamente implementado**, substituindo o rascunho original de `api-spec.md`. Toda rota tem prefixo `/api/v1/`.

**Base URL (dev local)**: `https://localhost:7060`
**Auth**: JWT Bearer no header `Authorization: Bearer {token}` (exceto register/login/refresh). Access Token expira em 15 min (900s). Refresh Token em cookie HttpOnly, 7 dias, rotacionado a cada uso.

---

## Auth

### POST `/api/v1/auth/register`

Body: `{ name, email, password }`
201 → `{ id, name, email }` · 400 (validação) · 409 (email duplicado)

### POST `/api/v1/auth/login`

Body: `{ email, password }`
200 → `{ accessToken, expiresIn }` + cookie `refreshToken` HttpOnly
401 (credenciais inválidas ou usuário inativo) · **Rate limit: 5 tentativas / 15 min por IP → 429**

### POST `/api/v1/auth/refresh`

Sem body (usa cookie `refreshToken` automaticamente)
200 → `{ accessToken, expiresIn }` + novo cookie `refreshToken` (rotacionado)
401 (token inválido/expirado)

### POST `/api/v1/auth/logout`

204 (remove cookie do lado do cliente)

---

## Boards

### GET `/api/v1/boards?search={texto}`

Retorna boards onde o usuário é membro.
200 → `[{ id, title, description, backgroundColor, taskCount, memberCount, updatedAt }]`

### POST `/api/v1/boards`

Body: `{ title, description?, backgroundColor? }` (backgroundColor em HEX `#RRGGBB`)
Cria automaticamente 3 colunas: "To Do", "In Progress", "Done", e o criador como Owner.
201 → `BoardDetailResponse` (ver abaixo)

### GET `/api/v1/boards/{boardId}`

200 → `BoardDetailResponse`:

```json
{
  "id": "guid", "title": "string", "description": "string|null",
  "ownerId": "guid", "backgroundColor": "string|null", "isPublic": false,
  "createdAt": "datetime", "updatedAt": "datetime",
  "columns": [{ "id", "title", "order", "limit" }],
  "members": [{ "userId", "name", "email", "role": "Owner|Admin|Member" }]
}
```

404 (não existe) · 403 (não é membro)

### PUT `/api/v1/boards/{boardId}`

Body: `{ title, description?, backgroundColor? }`
200 → `BoardDetailResponse`

### DELETE `/api/v1/boards/{boardId}`

204 · 403 (só o Owner pode excluir)

### POST `/api/v1/boards/{boardId}/members`

Body: `{ userId, role: "Owner"|"Admin"|"Member" }` — só Owner/Admin podem chamar
201 → `{ userId, name, email, role }`

---

## Columns

### POST `/api/v1/boards/{boardId}/columns`

Body: `{ title, limit? }` (limit = WIP limit, opcional)
201 → `{ id, title, order, limit }`

### PUT `/api/v1/columns/{columnId}`

Body: `{ title, limit? }`
200 → `{ id, title, order, limit }`

### DELETE `/api/v1/columns/{columnId}?moveTasksToColumnId={guid?}`

Remove a coluna e realoca as tasks pra outra coluna (se `moveTasksToColumnId` omitido, usa a primeira coluna restante). Board precisa ficar com pelo menos 1 coluna.
204 · 400 (só resta 1 coluna)

---

## Tasks

### GET `/api/v1/boards/{boardId}/tasks?columnId=&priority=&labelId=&assigneeId=&dueDateFrom=&dueDateTo=&search=`

Todos os filtros são opcionais e combináveis. `priority`: `Low|Medium|High|Urgent`.
200 → `[TaskResponse]`

### POST `/api/v1/boards/{boardId}/tasks`

Body:

```json
{
  "columnId": "guid", "title": "string", "description": "string|null",
  "priority": "Low|Medium|High|Urgent", "dueDate": "datetime|null",
  "labelIds": ["guid"] | null, "assigneeId": "guid|null"
}
```

201 → `TaskResponse`:

```json
{
  "id", "boardId", "columnId", "title", "description", "priority",
  "dueDate", "order", "assigneeId", "createdById", "createdAt", "updatedAt",
  "labels": [{ "id", "name", "color" }]
}
```

### GET `/api/v1/tasks/{taskId}`

200 → `TaskResponse`

### PUT `/api/v1/tasks/{taskId}`

Body: `{ title, description?, priority, dueDate?, labelIds? }` (não altera coluna/order — usar endpoint de move para isso)
200 → `TaskResponse`

### PATCH `/api/v1/tasks/{taskId}/assign`

Body: `{ assigneeId: "guid"|null }` (null = desatribuir)
200 → `TaskResponse` · 400 (assignee não é membro do board)

### PATCH `/api/v1/tasks/{taskId}/move`

Body: `{ newColumnId: "guid", newOrder: number }` — usar para drag & drop, tanto entre colunas quanto reordenação na mesma coluna. O backend recalcula todos os `order` da(s) coluna(s) afetada(s) automaticamente.
200 → `TaskResponse`

### DELETE `/api/v1/tasks/{taskId}`

204

---

## Labels

### GET `/api/v1/boards/{boardId}/labels`

200 → `[{ id, boardId, name, color }]`

### POST `/api/v1/boards/{boardId}/labels`

Body: `{ name, color }` (color em HEX). Nome deve ser único no board.
201 → `{ id, boardId, name, color }` · 400 (nome duplicado ou cor inválida)

### PUT `/api/v1/labels/{labelId}`

Body: `{ name, color }`
200 → `{ id, boardId, name, color }`

### DELETE `/api/v1/labels/{labelId}`

204 (remove label e todas as associações com tasks automaticamente)

---

## Users

### GET `/api/v1/users?search={texto}`

Busca usuários ativos por nome ou email (case-insensitive, `Contains`). Sem `search`, retorna os primeiros usuários (ordenados por nome). Limitado a 20 resultados por chamada. Usado principalmente no fluxo de "Adicionar Membro" ao board.
200 → `[{ id, name, email }]`

---

## Export

### GET `/api/v1/boards/{boardId}/export?format=csv|pdf&includeCompleted=true|false&dateFrom=&dateTo=`

Retorna o arquivo direto (`Content-Disposition` implícito via nome do arquivo), `format` obrigatório.
200 → binary file (`text/csv` ou `application/pdf`)

---

## Realtime (SignalR)

**Hub**: `/hubs/kanban`
**Auth**: JWT via header padrão OU query string `?access_token={token}` (necessário para o handshake do SignalR em alguns transportes).

### Métodos que o cliente chama

- `JoinBoard(boardId: guid)` — valida que o usuário é membro antes de entrar no grupo; lança `HubException` se não for.
- `LeaveBoard(boardId: guid)`

### Eventos que o servidor emite (nome do evento + payload)

Todos os eventos são enviados para o grupo `board-{boardId}`, incluindo pro próprio autor da ação (para consistência de UI):

| Evento         | Payload (aproximado)                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `TaskCreated`  | `{ taskId, columnId, title, createdByUserId }`                             |
| `TaskUpdated`  | `{ taskId, title, priority, updatedByUserId }`                             |
| `TaskMoved`    | `{ taskId, oldColumnId, newColumnId, newOrder, movedByUserId, timestamp }` |
| `TaskDeleted`  | `{ taskId, deletedByUserId }`                                              |
| `TaskAssigned` | `{ taskId, assigneeId, assignedByUserId }`                                 |
| `BoardUpdated` | `{ boardId, title, updatedByUserId }`                                      |
| `MemberJoined` | `{ boardId, userId, name, role, addedByUserId }`                           |
| `LabelCreated` | `{ labelId, name, color, createdByUserId }`                                |
| `LabelUpdated` | `{ labelId, name, color, updatedByUserId }`                                |
| `LabelDeleted` | `{ labelId, deletedByUserId }`                                             |

> Nota: os payloads são objetos anônimos C# — os nomes de campos acima são fiéis ao código, mas vale conferir a serialização JSON real (camelCase) ao integrar.

---

## Erros (formato padrão, Problem-Details-like)

Todas as exceções de negócio retornam:

```json
{ "title": "mensagem legível", "status": 400 }
```

Erros de validação (FluentValidation) retornam:

```json
{ "title": "Erro de validação", "status": 400, "errors": ["mensagem 1", "mensagem 2"] }
```

Códigos usados: `400` (validação/regra de negócio), `401` (não autenticado/credenciais inválidas), `403` (autenticado mas sem permissão), `404` (não encontrado), `409` (conflito, ex: email duplicado), `429` (rate limit excedido).
