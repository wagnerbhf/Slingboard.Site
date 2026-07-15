# Handoff — Slingboard: Backend → Frontend

## Como usar este pacote

Estes arquivos devem ser colocados na pasta `docs/frontend/` do repositório `Slingboard`. Ao abrir o Claude Code no VS Code pela primeira vez, cole uma mensagem parecida com:

> "Este é o projeto Slingboard (Kanban board). O backend em .NET 10 já está 100% completo e testado — a spec está em `docs/frontend/api-contract.md`. Quero começar o frontend em Angular seguindo `docs/frontend/frontend-constitution.md` e `docs/frontend/frontend-spec.md`. Vamos começar pelo scaffold do projeto."

Isso já dá ao Claude Code todo o contexto necessário, sem precisar reexplicar decisões já tomadas.

---

## Status atual do projeto

### Backend — 100% completo

- **Stack real**: .NET 10, C# 14, ASP.NET Core Minimal APIs, EF Core 10 + Npgsql, PostgreSQL 16 (Docker), `Mediator` (martinothamar, NÃO o MediatR clássico — ver nota abaixo), FluentValidation, JWT + Refresh Token rotacionado, SignalR, QuestPDF, CsvHelper.
- **Arquitetura**: Clean Architecture + Vertical Slice (`Domain`, `Application`, `Infrastructure`, `Api`), sem Repository Pattern (Handlers acessam `IAppDbContext` com `DbSet<T>` diretamente).
- **Features implementadas**: Auth (Register/Login/Refresh/Logout), Boards (CRUD + Membros), Columns (CRUD + realocação de tasks), Tasks (CRUD + Move/Drag&Drop), Labels (CRUD), Export (CSV/PDF), Realtime (SignalR), Rate Limiting no login.
- **Testes**: Domain.Tests (xUnit + FluentAssertions), Application.Tests (xUnit + Moq + EF InMemory), IntegrationTests (xUnit + Testcontainers + Postgres real) — todos passando, CI rodando no GitHub Actions.
- **Versionamento**: todas as rotas usam prefixo `/api/v1/...`.

### Frontend — ainda não iniciado

Este é o próximo passo. Veja `frontend-constitution.md` e `frontend-spec.md` neste mesmo pacote.

---

## Decisões técnicas importantes (não repetir/questionar sem necessidade)

1. **Nome do projeto**: Slingboard (não mais "Kanban Board" genérico do spec original).
2. **Angular**: usar a versão mais atual disponível no momento (era Angular 22 na época deste handoff — **confirme a versão estável mais recente antes de rodar `ng new`**, pode ter mudado).
3. **Estrutura de pastas**: usar **pastas físicas reais** no disco (não Solution Folders/organização só visual) — isso já foi uma lição aprendida dolorosamente no backend (CI quebrava porque a estrutura visual do Visual Studio não batia com a estrutura real no Git). Ex: `frontend/src/app/features/boards/...` deve existir fisicamente, não só como agrupamento no editor.
4. **Repositório**: o backend está em `https://github.com/wagnerbhf/Slingboard`, branch principal chamada `master` (não `main`).
5. **Convenção de commits**: Conventional Commits (`feat:`, `fix:`, `ci:`, `docs:`, etc.) — já usado no backend.

## Gotchas técnicos aprendidos (relevantes se o frontend precisar tocar/entender o backend)

- A biblioteca `Mediator` (martinothamar) é diferente do MediatR clássico (que ficou comercial). Sintaxe é quase idêntica (`IRequest<T>`, `IRequestHandler<T,TResponse>`), mas é source-generator based.
- Handlers retornam `ValueTask<T>`, não `Task<T>`.
- CORS: se o frontend rodar em porta diferente da API (`localhost:4200` Angular vs `localhost:7060` API), será necessário configurar CORS no backend antes de integrar — **isso ainda não foi feito**, avise se for necessário.
- SignalR Hub: `/hubs/kanban`, requer JWT (aceita token via query string `?access_token=` especificamente para conexões de Hub, além do header Authorization padrão para REST).
- Refresh Token vem em cookie `HttpOnly` — o frontend não deve tentar ler/manipular esse cookie via JS; ele é enviado automaticamente pelo navegador em requests para o mesmo domínio.

---

## Próximos arquivos deste pacote

- `frontend-constitution.md` — princípios e stack do frontend (adaptado de Angular, já que o projeto original previa React)
- `frontend-spec.md` — especificação detalhada de telas, componentes, fluxos (adaptado pra Angular)
- `api-contract.md` — contrato real e completo da API (todos os endpoints, DTOs, exatamente como foram implementados — não é mais o rascunho original do `api-spec.md`)
