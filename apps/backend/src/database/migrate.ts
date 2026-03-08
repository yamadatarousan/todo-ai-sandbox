import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import BetterSqlite3 from "better-sqlite3";

export type RunMigrationsOptions = {
  migrationDirectoryPath?: string;
};

export type MigrationResult = {
  appliedCount: number;
  migrationDirectoryPath: string;
};

export const defaultBackendMigrationDirectoryPath = fileURLToPath(
  new URL("./migrations", import.meta.url),
);

export function runMigrations(
  client: InstanceType<typeof BetterSqlite3>,
  options: RunMigrationsOptions = {},
): MigrationResult {
  const migrationDirectoryPath =
    options.migrationDirectoryPath ?? defaultBackendMigrationDirectoryPath;
  const migrationFileNames = readMigrationFileNames(migrationDirectoryPath);

  client.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedMigrationNames = new Set(
    (
      client
        .prepare("SELECT name FROM schema_migrations ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((migration) => migration.name),
  );
  const applyMigration = client.transaction(
    (migrationFileName: string, migrationSql: string) => {
      client.exec(migrationSql);
      client
        .prepare("INSERT INTO schema_migrations (name) VALUES (?)")
        .run(migrationFileName);
    },
  );

  let appliedCount = 0;

  for (const migrationFileName of migrationFileNames) {
    if (appliedMigrationNames.has(migrationFileName)) {
      continue;
    }

    applyMigration(
      migrationFileName,
      readFileSync(join(migrationDirectoryPath, migrationFileName), "utf8"),
    );
    appliedCount += 1;
  }

  return {
    appliedCount,
    migrationDirectoryPath,
  };
}

function readMigrationFileNames(migrationDirectoryPath: string): string[] {
  try {
    return readdirSync(migrationDirectoryPath)
      .filter((fileName) => fileName.endsWith(".sql"))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    throw new Error(
      `migration ディレクトリを読めません: ${migrationDirectoryPath}`,
      { cause: error },
    );
  }
}
