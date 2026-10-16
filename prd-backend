# Product Requirements Document (PRD) — Backend Service

## 1. Overview & Objectives

### 1.1 Purpose
The backend service provides a robust, production-ready RESTful API for a Todo application. It manages the full lifecycle of tasks (creation, reading, updating, completion toggling, and deletion) backed by a PostgreSQL relational database.

### 1.2 Target Audience / AI Context
This document serves as the authoritative specification of the backend's architecture, business rules, data schemas, validation logic, API endpoints, and infrastructure requirements for engineers and AI coding assistants (such as Claude).

### 1.3 Tech Stack & Runtime
- **Runtime**: Node.js (ES Modules, `"type": "module"`)
- **Language**: TypeScript (`tsc` with strict typing)
- **Web Framework**: Express v5 (`express@^5.3.0`)
- **Database Driver**: `pg` (Node-Postgres connection pool)
- **Database**: PostgreSQL (v14+)
- **Security & Utilities**:
  - `helmet`: Security HTTP response headers
  - `cors`: Cross-Origin Resource Sharing handling
  - `morgan`: HTTP request logging
  - `dotenv`: Environment configuration management
  - `tsx` & `nodemon`: Development hot-reloading

---

## 2. System Architecture & Directory Layout

### 2.1 Layered Architecture
The backend follows a clean separation of concerns:
1. **Entrypoint (`src/index.ts`)**: Connects to the database, runs startup migrations/table initialization, binds HTTP listeners, and configures graceful shutdown (`SIGINT`, `SIGTERM`).
2. **App Configuration (`src/app.ts`)**: Initializes Express, security middleware (`helmet`, `cors`, `trust proxy`), logging, JSON parsing, and root route handlers.
3. **Routing (`src/routes/`)**: Declares REST endpoints, validates incoming request parameters/payloads, and maps to service calls.
4. **Services / Business Logic (`src/services/`)**: Contains business operations and direct SQL queries through the database pool.
5. **Data Models / Types (`src/models/`)**: Defines domain entities and input contracts.
6. **Config & Infrastructure (`src/config/`)**: Environment parser, PostgreSQL connection pool, and automated table bootstrap.
7. **Middleware (`src/middleware/`)**: Global 404 handler and structured error handling.

### 2.2 Directory Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts           # PostgreSQL Pool configuration & error listeners
│   │   ├── env.ts          # Environment variables with safe fallbacks
│   │   └── initDb.ts       # Idempotent database schema bootstrapper
│   ├── middleware/
│   │   ├── errorHandler.ts # Custom HttpError & uniform JSON error formatting
│   │   └── notFound.ts     # 404 handler for unmatched routes
│   ├── models/
│   │   └── todo.ts         # Todo interfaces and input types
│   ├── routes/
│   │   ├── health.ts       # Health-check endpoint (/api/health)
│   │   ├── index.ts        # Router aggregator (/api/...)
│   │   └── todos.ts        # Todo CRUD routes (/api/todos)
│   ├── services/
│   │   └── todoService.ts  # Database queries & domain mapping
│   ├── app.ts              # Express application assembly
│   └── index.ts            # Application bootstrapper & lifecycle manager
├── .env                    # Local environment config
├── .env.example            # Environment template
├── package.json
└── tsconfig.json
```

---

## 3. Data Model & Database Specification

### 3.1 Database Schema (`todos` table)
The database schema is initialized idempotently on startup via `initDb()`:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  completed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 Data Entities & TypeScript Interfaces
```typescript
// Domain Entity
export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

// Input contracts
export interface CreateTodoInput {
  title: string;
  description?: string;
  completed?: boolean;
}

export type UpdateTodoInput = Partial<CreateTodoInput>;
```

### 3.3 Database Row Mapping Rules
PostgreSQL row column names (`snake_case`) are mapped to JavaScript domain properties (`camelCase`):
- `id` -> `id: number`
- `title` -> `title: string`
- `description` -> `description: string`
- `completed` -> `completed: boolean`
- `created_at` (Date) -> `createdAt: (row.created_at as Date).toISOString()`
- `updated_at` (Date) -> `updatedAt: (row.updated_at as Date).toISOString()`

---

## 4. Business Logic & Validation Rules

### 4.1 ID Parameter Validation
- Must be a positive integer (`id >= 1`, integer only).
- If invalid (e.g. string, float, negative number): throws `HttpError(400, "Invalid todo id")`.

### 4.2 Request Body Validation
- **JSON Object Constraint**: Body must be a non-null object.
- **Title Validation**:
  - `POST`: `title` is **strictly required**. Must be a non-empty string after trimming whitespace. Throws `HttpError(400, "\`title\` is required")` or `HttpError(400, "\`title\` must be a non-empty string")`.
  - `PUT`: Requires a non-empty `title`.
  - `PATCH`: `title` is optional, but if supplied, must be non-empty after trimming.
- **Description Validation**:
  - Optional. If provided, must be a `string`. Defaults to `""` if omitted during creation.
- **Completed Status**:
  - Optional boolean (`true` or `false`). Defaults to `false` if omitted during creation.
- **Partial Updates (`PATCH`)**:
  - Must provide at least one field (`title`, `description`, or `completed`). Empty payloads throw `HttpError(400, "Provide at least one field to update")`.
- **Full Updates (`PUT`)**:
  - Replaces entire entity. If optional fields like `description` or `completed` are omitted from the payload, they reset to default values (`""` and `false`).

### 4.3 Query Parameter Filtering
- `GET /api/todos?completed=true|false`:
  - When `completed=true`: returns only completed tasks (`WHERE completed = true`).
  - When `completed=false`: returns only incomplete tasks (`WHERE completed = false`).
  - If any other value is passed: throws `HttpError(400, "\`completed\` query must be 'true' or 'false'")`.
  - Ordered by `id ASC`.

### 4.4 Timestamp Lifecycle
- On creation: `created_at` and `updated_at` are set to `NOW()`.
- On update: `updated_at` is updated to `NOW()`.

---

## 5. API Endpoint Specifications

Base URL in development: `http://localhost:3001`

### 5.1 System / Health Endpoints
#### `GET /`
- **Description**: Root ping.
- **Response**: `200 OK`
  ```json
  { "message": "Todo API is running ✅" }
  ```

#### `GET /api/health`
- **Description**: Service health and process uptime.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "uptime": 124.56,
    "timestamp": "2026-10-16T12:00:00.000Z"
  }
  ```

---

### 5.2 Todo Resource Endpoints (`/api/todos`)

#### 1. List Todos
- **Endpoint**: `GET /api/todos`
- **Query Params**: `completed?: 'true' | 'false'`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "title": "Deploy to VPS",
      "description": "Setup Nginx & PM2",
      "completed": false,
      "createdAt": "2026-10-16T08:00:00.000Z",
      "updatedAt": "2026-10-16T08:00:00.000Z"
    }
  ]
  ```

#### 2. Get Single Todo
- **Endpoint**: `GET /api/todos/:id`
- **Success Response**: `200 OK`
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Invalid todo id" }`
  - `404 Not Found`: `{ "error": "Todo not found" }`

#### 3. Create Todo
- **Endpoint**: `POST /api/todos`
- **Request Body**:
  ```json
  {
    "title": "Configure SSL",
    "description": "Use Certbot for Let's Encrypt",
    "completed": false
  }
  ```
- **Success Response**: `201 Created` with full created `Todo` entity.
- **Error Response**: `400 Bad Request`

#### 4. Full Replace Todo
- **Endpoint**: `PUT /api/todos/:id`
- **Request Body**:
  ```json
  {
    "title": "Configure SSL",
    "description": "Completed step",
    "completed": true
  }
  ```
- **Success Response**: `200 OK` with updated `Todo` entity.
- **Error Responses**: `400 Bad Request`, `404 Not Found`.

#### 5. Partial Update Todo
- **Endpoint**: `PATCH /api/todos/:id`
- **Request Body** (any combination of valid fields):
  ```json
  {
    "completed": true
  }
  ```
- **Success Response**: `200 OK` with updated `Todo` entity.
- **Error Responses**: `400 Bad Request`, `404 Not Found`.

#### 6. Delete Todo
- **Endpoint**: `DELETE /api/todos/:id`
- **Success Response**: `204 No Content` (Empty body)
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Invalid todo id" }`
  - `404 Not Found`: `{ "error": "Todo not found" }`

---

## 6. Error Handling & Security

### 6.1 Custom Error Architecture (`HttpError`)
```typescript
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
```

### 6.2 Standard Error Response Payload
All errors conform to this contract:
```json
{
  "error": "Error description message"
}
```
*Note*: When `NODE_ENV === "development"`, the error response also contains the `stack` trace for debugging.

### 6.3 Security Hardening
- **Reverse Proxy Support**: `app.set("trust proxy", 1)` is enabled to ensure client IP and SSL headers from upstream proxies (like Nginx) are properly recognized.
- **Helmet**: Secures HTTP headers against common attacks (XSS, Clickjacking, MIME-sniffing).
- **CORS**: Enabled globally to permit API calls from the Vite frontend.
- **Database Safety**: All database interactions use parameterized SQL queries (`$1, $2, ...`) to prevent SQL injection.

---

## 7. Configuration & Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `3000` (Local dev uses `3001`) | HTTP listening port |
| `NODE_ENV` | String | `development` | Runtime mode (`development` \| `production`) |
| `DATABASE_URL` | String | `postgresql://postgres@localhost:5432/todo` | PostgreSQL connection URI |

---

## 8. Development & Deployment Guidelines

### 8.1 Local Execution
```bash
# Install dependencies
npm install

# Run database & table migrations
# (initDb runs automatically on start)

# Start dev server with nodemon & tsx
npm run dev

# Compile TypeScript
npm run build

# Start production server
npm start
```

### 8.2 Production / VPS Deployment Checklist
1. **Node Environment**: Set `NODE_ENV=production`.
2. **Reverse Proxy (Nginx)**: Proxy requests from `https://your-domain.com/api` to `http://127.0.0.1:3001`.
3. **Process Management**: Use PM2 or systemd (`pm2 start dist/index.js --name todo-api`).
4. **PostgreSQL**: Ensure PostgreSQL instance has the database created and credentials supplied via `DATABASE_URL`.
