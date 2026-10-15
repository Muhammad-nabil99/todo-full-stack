# Todo API — Express + TypeScript

A REST backend for todos with full CRUD. Data is stored in memory (resets on restart);
swap `src/services/todoService.ts` for a database layer when you're ready.

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled build |
| `npm run typecheck` | Type-check only |

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/todos` | List todos (`?completed=true\|false` to filter) |
| GET | `/api/todos/:id` | Get one todo |
| POST | `/api/todos` | Create (`title` required; `description`, `completed` optional) |
| PUT | `/api/todos/:id` | Replace a todo (`title` required) |
| PATCH | `/api/todos/:id` | Partially update (any of `title`, `description`, `completed`) |
| DELETE | `/api/todos/:id` | Delete (returns 204) |

## Examples
```bash
curl -X POST localhost:3000/api/todos -H 'Content-Type: application/json' \
  -d '{"title":"Buy milk","description":"2 liters"}'

curl localhost:3000/api/todos

curl -X PATCH localhost:3000/api/todos/1 -H 'Content-Type: application/json' \
  -d '{"completed":true}'

curl -X DELETE localhost:3000/api/todos/1
```

## Structure
```
src/
  config/env.ts
  middleware/{errorHandler,notFound}.ts
  models/todo.ts
  services/todoService.ts   # data layer (in-memory)
  routes/{index,health,todos}.ts
  app.ts                    # Express app setup
  index.ts                  # Server entry
```
