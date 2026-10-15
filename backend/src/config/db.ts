import pg from "pg";
import { env } from "./env.js";

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});

// Log connection issues
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  process.exit(1);
});

export default pool;
