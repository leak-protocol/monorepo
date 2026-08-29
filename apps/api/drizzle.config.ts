import { defineConfig } from "drizzle-kit";
import { readEnv } from "./src/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: readEnv().LEAK_DATABASE_URL },
});
