import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseConnection } from "../database/createDatabaseConnection";
import { runMigrations } from "../database/migrate";
import { createSqliteTodoRepository } from "./createSqliteTodoRepository";

async function createTemporaryDatabase() {
  const temporaryDirectoryPath = await mkdtemp(
    join(tmpdir(), "todo-ai-sandbox-sqlite-repository-"),
  );
  const databaseFilePath = join(temporaryDirectoryPath, "test.sqlite");
  const connection = createDatabaseConnection({ databaseFilePath });

  return {
    connection,
    temporaryDirectoryPath,
  };
}

describe("createSqliteTodoRepository", () => {
  it("Todo を SQLite へ保存する", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);
      const repository = createSqliteTodoRepository({
        database: connection.db,
      });
      const fixedDate = new Date("2026-03-08T00:00:00.000Z");

      const savedTodo = await repository.create({
        createdAt: fixedDate,
        id: "todo-1",
        isCompleted: false,
        title: "最初の Todo",
        updatedAt: fixedDate,
      });

      expect(savedTodo).toEqual({
        createdAt: fixedDate,
        id: "todo-1",
        isCompleted: false,
        title: "最初の Todo",
        updatedAt: fixedDate,
      });
      expect(
        connection.client
          .prepare(
            "select id, title, is_completed as isCompleted from todos where id = ?",
          )
          .get("todo-1"),
      ).toEqual({
        id: "todo-1",
        isCompleted: 0,
        title: "最初の Todo",
      });
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });
});
