import pool from "./db.js";

/**
 * Creates the `todos` table if it doesn't already exist.
 * Called once on server startup.
 */
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      completed   BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✅ Database initialised — todos table ready");
}
