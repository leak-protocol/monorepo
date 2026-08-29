import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default async function globalSetup() {
  const url =
    process.env.LEAK_DATABASE_URL ?? "postgres://localhost:5432/leak_api_test";
  const sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql.end();
}
