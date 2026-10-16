const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.NODE_ENV === "production") {
throw new Error("DATABASE_URL is required in production");
}
export const env = {
port: Number(process.env.PORT) || 3000,
nodeEnv: process.env.NODE_ENV ?? "development",
databaseUrl: databaseUrl ?? "postgresql://postgres@localhost:5432/todo",
};