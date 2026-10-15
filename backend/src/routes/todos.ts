import { Router } from "express";
import type { CreateTodoInput, UpdateTodoInput } from "../models/todo.js";
import { HttpError } from "../middleware/errorHandler.js";
import { todoService } from "../services/todoService.js";

const router = Router();

function parseId(raw: string | string[] | undefined): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid todo id");
  return id;
}

/** Validates a body. When `partial` is true, every field is optional (PATCH). */
function parseBody(body: unknown, partial: boolean): UpdateTodoInput {
  if (typeof body !== "object" || body === null) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
  const { title, description, completed } = body as Record<string, unknown>;
  const result: UpdateTodoInput = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw new HttpError(400, "`title` must be a non-empty string");
    }
    result.title = title.trim();
  } else if (!partial) {
    throw new HttpError(400, "`title` is required");
  }

  if (description !== undefined) {
    if (typeof description !== "string") throw new HttpError(400, "`description` must be a string");
    result.description = description;
  }

  if (completed !== undefined) {
    if (typeof completed !== "boolean") throw new HttpError(400, "`completed` must be a boolean");
    result.completed = completed;
  }

  if (partial && Object.keys(result).length === 0) {
    throw new HttpError(400, "Provide at least one field to update");
  }

  return result;
}

// READ (list) — optional ?completed=true|false
router.get("/", async (req, res) => {
  const { completed } = req.query;
  if (completed !== undefined && completed !== "true" && completed !== "false") {
    throw new HttpError(400, "`completed` query must be 'true' or 'false'");
  }
  res.json(
    await todoService.list({ completed: completed === undefined ? undefined : completed === "true" }),
  );
});

// READ (one)
router.get("/:id", async (req, res) => {
  const todo = await todoService.get(parseId(req.params.id));
  if (!todo) throw new HttpError(404, "Todo not found");
  res.json(todo);
});

// CREATE
router.post("/", async (req, res) => {
  const data = parseBody(req.body, false) as CreateTodoInput;
  res.status(201).json(await todoService.create(data));
});

// UPDATE (full replace) — title required, omitted optional fields reset to defaults
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const data = parseBody(req.body, false) as CreateTodoInput;
  const todo = await todoService.update(id, {
    title: data.title,
    description: data.description ?? "",
    completed: data.completed ?? false,
  });
  if (!todo) throw new HttpError(404, "Todo not found");
  res.json(todo);
});

// UPDATE (partial)
router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const todo = await todoService.update(id, parseBody(req.body, true));
  if (!todo) throw new HttpError(404, "Todo not found");
  res.json(todo);
});

// DELETE
router.delete("/:id", async (req, res) => {
  if (!(await todoService.delete(parseId(req.params.id)))) throw new HttpError(404, "Todo not found");
  res.status(204).send();
});

export default router;
