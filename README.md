# Slingboard — Frontend

Web frontend for **Slingboard**, a Kanban board application: boards, columns, tasks, labels, board members, and CSV/PDF exports, with realtime updates across collaborators.

Built with **Angular 22** (standalone components, zoneless change detection, signals) on top of `.NET`/ASP.NET Core backend (separate repository/service).

## Tech stack

- **Angular 22** — standalone components, `provideZonelessChangeDetection()` (no `zone.js`), signals as the primary local state, the `httpResource()` API for reactive data fetching
- **TypeScript** — strict mode
- **Tailwind CSS v4** — CSS-first configuration
- **spartan-ng** — headless, shadcn-style UI primitives (`shared/ui/`), styled with Tailwind
- **Angular CDK** — Drag & Drop for the kanban board
- **@microsoft/signalr** — realtime updates over the `/hubs/kanban` hub
- **RxJS** — interop with signals via `toSignal()` / `takeUntilDestroyed()`
- **Vitest** — unit tests, via `@angular/build:unit-test`
- **ESLint + Prettier + Husky/lint-staged** — linting and formatting, enforced on commit

## Features

- **Auth** — register, login, silent session restore on page load/new tabs via refresh token (httpOnly cookie), automatic 401 retry
- **Dashboard** — searchable grid of boards the user belongs to; create board dialog
- **Kanban board** — horizontally scrollable columns, drag & drop (within and across columns) with optimistic updates and rollback on failure, inline board title editing, avatar stack of members
- **Columns** — create, rename, set WIP limit, and delete directly from the board
- **Tasks** — create/edit modal (title, description, priority, due date, labels, assignee), quick-create per column
- **Filters** — filter the board's tasks by priority, label, assignee, and due-date range
- **Labels** — per-board label manager with live color preview
- **Members** — view current members and add new ones via debounced user search
- **Export** — download the board as CSV or PDF, with a "include completed" toggle and date-range filter
- **Realtime** — task/board/label/member changes from other users update the UI live via SignalR, without duplicating the local optimistic update for the acting user
- **Toasts** — consistent, app-wide error notifications wired into the HTTP error interceptor

## Project structure

```
src/app/
  core/            # auth, HTTP interceptors, realtime service, theme
  shared/
    ui/            # spartan-ng generated primitives (button, input, dialog, sonner, ...)
    forms/         # zoneless-safe reactive forms helpers
  features/
    auth/          # login, register
    boards/        # dashboard, board detail, columns, filters, members, board settings
    tasks/         # task card, task modal
    labels/        # labels manager
    exports/       # export modal
  layouts/         # authenticated shell
```

## Prerequisites

- Node.js and npm (see `package.json` for the Angular CLI version in use)
- The Slingboard **backend** running locally (default: `https://localhost:7060`) — see `docs/00-handoff.md`

## Getting started

```bash
npm install
npm start
```

This runs `ng serve` and serves the app at `http://localhost:4200`, reloading automatically on file changes.

> **Note:** the frontend calls the backend directly (no dev proxy). The backend must have CORS configured to accept requests from `http://localhost:4200`, otherwise API calls will fail in the browser even though the UI loads. See `docs/00-handoff.md`.

## Configuration

API endpoints are set per environment in `src/environments/`:

- `environment.ts` (production) — `apiOrigin`/`apiBaseUrl` left blank, expected to be same-origin
- `environment.development.ts` — points to `https://localhost:7060`

## Available scripts

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm start`     | Run the dev server (`ng serve`)     |
| `npm run build` | Production build, output to `dist/` |
| `npm run watch` | Development build in watch mode     |
| `npm test`      | Run unit tests (Vitest)             |
| `npm run lint`  | Run ESLint                          |

## Testing

Unit tests cover services, HTTP interceptors, and components with non-trivial logic (drag & drop, forms, debounced search). Run with:

```bash
npm test
```

End-to-end tests are not set up in this project.

## Project documentation

See `docs/` for the specs this frontend was built against:

- `frontend-spec.md` — screens, components, and state management approach
- `api-contract.md` — backend REST endpoints and SignalR realtime events
- `frontend-constitution.md` — architectural conventions and constraints
- `00-handoff.md` — backend handoff notes, including the CORS caveat above
