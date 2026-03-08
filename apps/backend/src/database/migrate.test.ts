import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseConnection } from "./createDatabaseConnection";
import { runMigrations } from "./migrate";
import { todoTitleMaxLength, todos } from "./schema";

async function createTemporaryDatabase() {
  const temporaryDirectoryPath = await mkdtemp(
    join(tmpdir(), "todo-ai-sandbox-database-"),
  );
  const databaseFilePath = join(temporaryDirectoryPath, "test.sqlite");
  const connection = createDatabaseConnection({ databaseFilePath });

  return {
    connection,
    databaseFilePath,
    temporaryDirectoryPath,
  };
}

describe("runMigrations", () => {
  it("todos テーブルと schema_migrations テーブルを作る", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);

      const tables = connection.client
        .prepare(
          "select name from sqlite_master where type = 'table' order by name",
        )
        .all() as Array<{ name: string }>;
      const columns = connection.client
        .prepare("pragma table_info(todos)")
        .all() as Array<{
          dflt_value: string | null;
          name: string;
          notnull: number;
          pk: number;
        }>;

      expect(tables).toEqual(
        expect.arrayContaining([
          { name: "schema_migrations" },
          { name: "todos" },
        ]),
      );
      expect(columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "id",
            notnull: 1,
            pk: 1,
          }),
          expect.objectContaining({
            name: "title",
            notnull: 1,
          }),
          expect.objectContaining({
            dflt_value: "0",
            name: "is_completed",
            notnull: 1,
          }),
        ]),
      );
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("同じ migration を再実行しても重複適用しない", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);
      runMigrations(connection.client);

      const appliedMigrationCount = connection.client
        .prepare("select count(*) as count from schema_migrations")
        .get() as { count: number };

      expect(appliedMigrationCount.count).toBe(1);
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("空文字 title を Database 制約で拒否する", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);

      expect(() => {
        connection.db
          .insert(todos)
          .values({
            createdAt: new Date("2026-03-07T00:00:00.000Z"),
            id: "todo-empty-title",
            isCompleted: false,
            title: "",
            updatedAt: new Date("2026-03-07T00:00:00.000Z"),
          })
          .run();
      }).toThrow(/todo_title_not_empty/);
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("長すぎる title を Database 制約で拒否する", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);

      expect(() => {
        connection.db
          .insert(todos)
          .values({
            createdAt: new Date("2026-03-07T00:00:00.000Z"),
            id: "todo-too-long-title",
            isCompleted: false,
            title: "a".repeat(todoTitleMaxLength + 1),
            updatedAt: new Date("2026-03-07T00:00:00.000Z"),
          })
          .run();
      }).toThrow(/todo_title_within_max_length/);
    } finally {
      connection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("有効な Todo を登録できる", async () => {
    const { connection, temporaryDirectoryPath } = await createTemporaryDatabase();

    try {
      runMigrations(connection.client);

      connection.db
        .insert(todos)
        .values({
          createdAt: new Date("2026-03-07T00:00:00.000Z"),
          id: "todo-1",
          isCompleted: false,
          title: "最初の Todo",
          updatedAt: new Date("2026-03-07T00:00:00.000Z"),
        })
        .run();

      const savedTodo = connection.client
        .prepare(
          "select id, title, is_completed as isCompleted from todos where id = ?",
        )
        .get("todo-1") as {
          id: string;
          isCompleted: number;
          title: string;
        };

      expect(savedTodo).toEqual({
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
