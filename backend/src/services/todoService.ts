import pool from "../config/db.js";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "../models/todo.js";

/** Maps a database row to our Todo interface */
function rowToTodo(row: Record<string, unknown>): Todo {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    completed: row.completed as boolean,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export const todoService = {
  async list(filter?: { completed?: boolean }): Promise<Todo[]> {
    let query = "SELECT * FROM todos";
    const values: unknown[] = [];

    if (filter?.completed !== undefined) {
      query += " WHERE completed = $1";
      values.push(filter.completed);
    }

    query += " ORDER BY id ASC";

    const { rows } = await pool.query(query, values);
    return rows.map(rowToTodo);
  },

  async get(id: number): Promise<Todo | undefined> {
    const { rows } = await pool.query("SELECT * FROM todos WHERE id = $1", [id]);
    return rows.length ? rowToTodo(rows[0]) : undefined;
  },

  async create(input: CreateTodoInput): Promise<Todo> {
    const { rows } = await pool.query(
      `INSERT INTO todos (title, description, completed)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.title, input.description ?? "", input.completed ?? false],
    );
    return rowToTodo(rows[0]);
  },

  async update(id: number, input: UpdateTodoInput): Promise<Todo | undefined> {
    // Build SET clause dynamically based on provided fields
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(input.description);
    }
    if (input.completed !== undefined) {
      setClauses.push(`completed = $${paramIndex++}`);
      values.push(input.completed);
    }

    if (setClauses.length === 0) return this.get(id);

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE todos SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows.length ? rowToTodo(rows[0]) : undefined;
  },

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  },
};
