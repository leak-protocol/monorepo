import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export const createDatabase = (
  url: string,
): { db: Database; close: () => Promise<void> } => {
  const sql = postgres(url, { max: 10 });
  return {
    db: drizzle(sql, { schema }),
    close: () => sql.end(),
  };
};
