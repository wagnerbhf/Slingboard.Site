# Constitution — Slingboard Frontend

## 1. Visão Geral

**Nome do Projeto:** Slingboard (frontend)
**Objetivo:** Interface web moderna, fluida e responsiva para o Kanban board, consumindo a API já pronta em `.NET 10` (ver `api-contract.md`).

## 2. Stack Tecnológica (Não Negociável)

- **Framework:** Angular (última versão estável disponível — confirmar no momento de iniciar, era Angular 22 na época deste handoff)
- **Linguagem:** TypeScript (strict mode)
- **Componentes:** Standalone components (sem NgModules) — padrão moderno do Angular
- **Reatividade:** Signals como fonte primária de estado local; `httpResource`/`resource` API para dados assíncronos onde aplicável
- **Gerenciamento de Estado do Servidor:** Considerar `TanStack Query for Angular` ou abordagem nativa com Signals + `HttpClient` + interceptors (decidir na hora, dependendo da maturidade da lib no momento)
- **Drag & Drop:** Angular CDK (`@angular/cdk/drag-drop`) — nativo do ecossistema Angular, substitui o `dnd-kit` do plano original (que era React-specific)
- **UI / Estilização:** Tailwind CSS + Angular Material ou biblioteca de componentes headless equivalente ao shadcn/ui (avaliar `spartan-ng` ou similar, que é o análogo mais próximo do shadcn/ui pra Angular)
- **Tema:** Dark mode nativo via Tailwind (`class` strategy)
- **Formulários:** Angular Reactive Forms + validação (considerar Signal Forms se já estável na versão usada)
- **Notificações:** biblioteca de toast compatível com Angular (ex: `ngx-sonner` ou equivalente)
- **Realtime:** `@microsoft/signalr` (mesmo client JS usado independente de framework)
- **Roteamento:** Angular Router (standalone, com `provideRouter`)
- **Testes:** Vitest ou Jasmine/Karman (o padrão do CLI pode ter mudado — confirmar) + Playwright para E2E
- **Lint/Formatação:** ESLint + Prettier + Husky

## 3. Princípios (herdados do projeto geral)

1. **API-First** — o contrato já existe e é fonte da verdade (`api-contract.md`); não inventar campos que a API não tem.
2. **Mobile-First & Responsivo**
3. **Performance & Fluidez** — optimistic updates em toda mutação, especialmente drag & drop.
4. **Componentes pequenos e reutilizáveis**, standalone, com inputs/outputs tipados (ou `input()`/`output()` signals se a versão suportar).
5. **Acessibilidade** — ARIA labels, navegação por teclado, especialmente no drag & drop.
6. **Pastas físicas reais** — a estrutura de diretórios deve existir de fato no disco, refletindo exatamente o que aparece no repositório Git (lição aprendida no backend).

## 4. Estrutura de Pastas (física, real)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                 # Interceptors, guards, serviços singleton (auth, signalr)
│   │   ├── shared/                # Componentes/pipes/diretivas reutilizáveis
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── boards/
│   │   │   ├── tasks/
│   │   │   ├── labels/
│   │   │   └── exports/
│   │   ├── layouts/
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── assets/
│   └── styles/
├── public/
└── angular.json
```

## 5. Autenticação — pontos de atenção específicos

- Access Token: guardar em memória (signal/service), **não em localStorage** (mitigar XSS) — reinjetar via interceptor HTTP em todo request.
- Refresh Token: já vem em cookie HttpOnly, o navegador cuida de enviá-lo sozinho pro endpoint `/api/v1/auth/refresh` — o frontend só precisa chamar esse endpoint quando o Access Token expirar (interceptor de 401 → tenta refresh → repete request original).
- Expiração do Access Token: 900 segundos (15 min) — vale agendar refresh proativo um pouco antes de expirar, não só reagir a 401.

## 6. CORS (backend precisa ser ajustado)

Como o Angular vai rodar em porta diferente da API (`localhost:4200` vs `localhost:7060`), será necessário configurar CORS no `Program.cs` do backend antes de qualquer chamada funcionar em dev. Isso **ainda não foi feito** — sinalizar como primeira tarefa de integração.

## 7. Definição de Pronto (herdado)

Mesmos critérios do projeto geral: spec escrita, testes (unitário + E2E), responsivo + dark mode, PR revisado, roda em Docker.
