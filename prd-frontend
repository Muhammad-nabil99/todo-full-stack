# Product Requirements Document (PRD) — Frontend Client

## 1. Overview & Vision

### 1.1 Purpose
The frontend client provides an intuitive, highly responsive, and visually modern user interface for managing personal tasks. It interfaces directly with the Todo REST API to synchronize user actions with the PostgreSQL database.

### 1.2 Target Audience / AI Context
This document specifies the user experience, component architecture, state management rules, optimistic UI patterns, styling tokens, and networking requirements for engineers and AI coding assistants (such as Claude).

### 1.3 Tech Stack
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool / Bundler**: Vite 6+ (`@vitejs/plugin-react`)
- **Language**: TypeScript (`.tsx`, strict typing)
- **Styling**: Vanilla CSS with modern custom properties, glassmorphism, and responsive layout
- **Icons & Graphics**: Inline scalable vector graphics (SVG)

---

## 2. Architecture & File Structure

### 2.1 File Organization
```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Brand and visual assets
│   ├── App.tsx             # Main view, state coordinator & UI handlers
│   ├── App.css             # Component styling, animations & theme tokens
│   ├── index.css           # Global resets, system font stack & typography
│   └── main.tsx            # React root mount point (Strict Mode)
├── .env                    # Environment config (VITE_API_URL)
├── .env.example            # Environment template
├── index.html              # HTML shell with responsive viewport
├── vite.config.ts          # Vite build & development proxy setup
├── tsconfig.json           # Root TypeScript configuration
└── tsconfig.app.json       # App-specific TypeScript compiler options
```

---

## 3. UI/UX Design System & Aesthetics

### 3.1 Design Language
- **Theme**: Sleek Dark Glassmorphism.
- **Ambient Lighting**: Animated colorful blurred background blobs (`blob-a` purple/indigo, `blob-b` cyan/sky) creating depth behind the frosted glass card.
- **Card**: Translucent backdrop blur (`backdrop-filter: blur(18px)`) with subtle hairline border (`rgba(255, 255, 255, 0.1)`).
- **Typography**: Clean modern system font stack (`system-ui`, `-apple-system`, BlinkMacSystemFont, Segoe UI, Roboto).
- **Color Palette**:
  - Background: Deep slate (`#0b0f19`)
  - Surface Glass: `rgba(18, 24, 38, 0.75)`
  - Accent Primary: Soft Violet / Lavender (`#a78bfa`)
  - Accent Secondary: Cyan / Sky Blue (`#38bdf8`)
  - Success / Check: Indigo-to-Cyan gradient
  - Danger / Error: Crimson / Rose (`#f43f5e`, background `rgba(244, 63, 94, 0.12)`)
  - Text: High contrast white (`#f8fafc`) for headers, muted grey (`#94a3b8`) for subtitles.

---

## 4. State Management & Core Data Flow

The application manages local state inside `App.tsx` and maintains synchronization with the backend:

### 4.1 State Definitions
```typescript
interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

type Filter = 'all' | 'active' | 'done';
```

| State Variable | Type | Default | Purpose |
|---|---|---|---|
| `todos` | `Todo[]` | `[]` | Master list of all tasks from database |
| `filter` | `Filter` | `'all'` | Currently active filter tab |
| `draft` | `string` | `""` | Controlled text input for creating a new task |
| `loading` | `boolean` | `true` | Indicates initial data fetch from API |
| `error` | `string` | `""` | User-facing banner message for network or server errors |
| `editingId` | `number \| null` | `null` | The ID of the item currently in inline edit mode |
| `editText` | `string` | `""` | Current input value during inline editing |

---

## 5. Feature Specifications & Business Rules

### 5.1 Initial Data Loading
- On component mount (`useEffect`), sends `GET /todos` to the API.
- If request succeeds: sets `todos` state.
- If request fails: captures error and renders friendly warning (`Can't reach the API at <URL>. Is the backend running?`).
- Sets `loading = false` in `finally` block.

### 5.2 Header & Completion Metrics
- **Dynamic Date**: Formats current date localized (e.g., `"Thursday, October 16"`).
- **Task Counter**: Displays `${doneCount} of ${todos.length} completed` (or `"Nothing here yet"` if empty).
- **Radial SVG Progress Ring**:
  - Circumference formula: $2 \times \pi \times 26 \approx 163.36\text{px}$.
  - Percentage: $\text{round}((\text{doneCount} / \text{totalCount}) \times 100)$.
  - Dynamic `strokeDashoffset` dynamically animates the gradient stroke along the circle circumference.

### 5.3 Task Creation
- **Trigger**: Form submit (`Add` button or pressing `Enter` in input).
- **Rules**:
  - Max length: 120 characters.
  - Trimmed before validation. Empty string submissions are blocked (`disabled={!draft.trim()}`).
- **Network & State**:
  - Clears draft and errors immediately.
  - Sends `POST /todos` with `{ title }`.
  - Appends the returned `Todo` to `todos` array.
  - On error: Restores the draft in the input field and displays error message.

### 5.4 Task Completion Toggle (Optimistic Update)
- **Trigger**: Clicking custom checkbox.
- **Optimistic Behavior**:
  - Immediately flips `completed` state in UI (`!todo.completed`).
- **Network Call**: Sends `PATCH /todos/:id` with `{ completed: !todo.completed }`.
- **Rollback**: If the API call fails, reverts `todos` to snapshot prior to toggle and displays error message.

### 5.5 Inline Title Editing
- **Trigger**: Double-clicking a task title.
- **Behavior**:
  - Switches item from text span to focused input field (`autoFocus` / `editRef.current?.focus()`).
- **Save Actions**:
  - Pressing `Enter` or clicking outside (`onBlur`).
  - If title is unchanged or trimmed to empty string, cancels edit without network request.
- **Optimistic Update**: Updates `todos` locally, sends `PATCH /todos/:id` with `{ title: newTitle }`.
- **Cancellation**: Pressing `Escape` key immediately exits edit mode without saving.
- **Rollback**: Restores original title on API error.

### 5.6 Task Deletion
- **Trigger**: Clicking the delete button (`✕`) on a list item.
- **Optimistic Behavior**: Immediately removes the item from local list.
- **Network Call**: Sends `DELETE /todos/:id`.
- **Rollback**: Restores item into the list if the server request fails.

### 5.7 Batch Clear Completed
- **Trigger**: "Clear completed" button in the card footer.
- **Condition**: Disabled if `doneCount === 0`.
- **Behavior**:
  - Optimistically filters out all tasks with `completed: true`.
  - Dispatches parallel `Promise.all` requests calling `DELETE /todos/:id` for each completed item.
  - If any delete request fails: reverts state and displays error.

### 5.8 Filtering Logic
- Client-side memoized filter (`useMemo`):
  - `'all'`: Shows all tasks in `todos`.
  - `'active'`: Shows tasks where `!todo.completed`.
  - `'done'`: Shows tasks where `todo.completed`.
- Empty state messages adapt dynamically:
  - If filter is `'done'`: `"No completed tasks yet"`.
  - If filter is `'active'`: `"All caught up 🎉"`.
  - If list is empty: `"Add your first task above ✨"`.

---

## 6. Networking & API Client Layer

### 6.1 Unified Fetch Wrapper
All HTTP interactions route through a typed helper:
```typescript
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
```

### 6.2 Base API URL Resolution
- Configured via environment variable:
  ```typescript
  const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
  ```
- Defaults to `http://localhost:3001/api` for local development.

### 6.3 Development Proxying (`vite.config.ts`)
Vite's development server proxies `/api` directly to `http://localhost:3001`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

---

## 7. Responsive Design & Accessibility

- **Mobile First**: Fluid widths with a `max-width: 520px` card container centered vertically and horizontally.
- **Accessibility**:
  - All form controls have descriptive `aria-label` tags (`"New task"`, `"Mark ... as done"`, `"Delete ..."`).
  - Keyboard navigation: full Tab order support, `Enter` to submit/save, `Escape` to cancel.
  - Error messages have `role="alert"`.

---

## 8. Build & Deployment Guidelines

### 8.1 Build Command
```bash
# Type check and build production distribution
npm run build
```
Generates production bundle in `dist/`.

### 8.2 Production / VPS Deployment Checklist
1. Provide production API endpoint via build argument:
   ```bash
   VITE_API_URL=https://your-domain.com/api npm run build
   ```
2. Serve static files using Nginx:
   ```nginx
   location / {
       root /var/www/frontend/dist;
       try_files $uri $uri/ /index.html;
   }
   ```
