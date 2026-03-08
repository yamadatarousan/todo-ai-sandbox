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

  it("保存済み Todo 一覧を新しい順で返す", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);
      const repository = createSqliteTodoRepository({
        database: connection.db,
      });

      await repository.create({
        createdAt: new Date("2026-03-07T00:00:00.000Z"),
        id: "todo-1",
        isCompleted: false,
        title: "最初の Todo",
        updatedAt: new Date("2026-03-07T00:00:00.000Z"),
      });
      await repository.create({
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        id: "todo-2",
        isCompleted: true,
        title: "二番目の Todo",
        updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      });

      await expect(repository.list()).resolves.toEqual([
        {
          createdAt: new Date("2026-03-08T00:00:00.000Z"),
          id: "todo-2",
          isCompleted: true,
          title: "二番目の Todo",
          updatedAt: new Date("2026-03-08T00:00:00.000Z"),
        },
        {
          createdAt: new Date("2026-03-07T00:00:00.000Z"),
          id: "todo-1",
          isCompleted: false,
          title: "最初の Todo",
          updatedAt: new Date("2026-03-07T00:00:00.000Z"),
        },
      ]);
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("保存済み Todo の完了状態を更新する", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);
      const repository = createSqliteTodoRepository({
        database: connection.db,
      });
      const createdAt = new Date("2026-03-08T00:00:00.000Z");
      const updatedAt = new Date("2026-03-10T00:00:00.000Z");

      await repository.create({
        createdAt,
        id: "todo-1",
        isCompleted: false,
        title: "最初の Todo",
        updatedAt: createdAt,
      });

      await expect(
        repository.updateCompletion({
          id: "todo-1",
          isCompleted: true,
          updatedAt,
        }),
      ).resolves.toEqual({
        createdAt,
        id: "todo-1",
        isCompleted: true,
        title: "最初の Todo",
        updatedAt,
      });
      expect(
        connection.client
          .prepare(
            "select id, is_completed as isCompleted, updated_at as updatedAt from todos where id = ?",
          )
          .get("todo-1"),
      ).toEqual({
        id: "todo-1",
        isCompleted: 1,
        updatedAt: updatedAt.getTime(),
      });
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("存在しない Todo の完了更新では undefined を返す", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);
      const repository = createSqliteTodoRepository({
        database: connection.db,
      });

      await expect(
        repository.updateCompletion({
          id: "missing-todo",
          isCompleted: true,
          updatedAt: new Date("2026-03-10T00:00:00.000Z"),
        }),
      ).resolves.toBeUndefined();
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });
});
