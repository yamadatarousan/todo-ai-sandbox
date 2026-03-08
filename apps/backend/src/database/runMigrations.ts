import { createDatabaseConnection } from "./createDatabaseConnection";
import { runMigrations } from "./migrate";

const connection = createDatabaseConnection();

try {
  const result = runMigrations(connection.client);

  console.info(
    [
      "SQLite migration completed.",
      `database: ${connection.databaseFilePath}`,
      `appliedCount: ${result.appliedCount}`,
      `migrationDirectory: ${result.migrationDirectoryPath}`,
    ].join(" "),
  );
} catch (error) {
  console.error("SQLite migration failed.", error);
  process.exitCode = 1;
} finally {
  connection.close();
}
