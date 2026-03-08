import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import BetterSqlite3 from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type CreateDatabaseConnectionOptions = {
  databaseFilePath?: string;
};

export type DatabaseConnection = {
  client: InstanceType<typeof BetterSqlite3>;
  close: () => void;
  databaseFilePath: string;
  db: BetterSQLite3Database<typeof schema>;
};

export const defaultBackendDatabaseFilePath = fileURLToPath(
  new URL("../../../../data/backend/app.sqlite", import.meta.url),
);

export function createDatabaseConnection(
  options: CreateDatabaseConnectionOptions = {},
): DatabaseConnection {
  const databaseFilePath =
    options.databaseFilePath ??
    process.env.TODO_AI_DATABASE_PATH ??
    defaultBackendDatabaseFilePath;

  mkdirSync(dirname(databaseFilePath), { recursive: true });

  const client = new BetterSqlite3(databaseFilePath);

  // Todo 以外のテーブルが増えても、参照制約を同じ前提で扱えるようにしておく。
  client.pragma("foreign_keys = ON");

  const db = drizzle(client, { schema });

  return {
    client,
    close() {
      client.close();
    },
    databaseFilePath,
    db,
  };
}
