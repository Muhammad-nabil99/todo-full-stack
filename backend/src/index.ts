import app from "./app.js";
import { env } from "./config/env.js";
import { initDb } from "./config/initDb.js";

async function start() {
  // Initialise database (create tables if needed)
  await initDb();

  const server = app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port} [${env.nodeEnv}]`);
  });

  function shutdown() {
    server.close(() => process.exit(0));
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
