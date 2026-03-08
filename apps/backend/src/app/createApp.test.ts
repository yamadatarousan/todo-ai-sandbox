import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseConnection } from "../database/createDatabaseConnection";
import { todoTitleMaxLength } from "../database/schema";
import { createApp } from "./createApp";

type LogEntry = {
  err?: {
    message?: string;
    stack?: string;
  };
  level?: number;
  msg?: string;
  req?: {
    method?: string;
    url?: string;
  };
  reqId?: string;
  res?: {
    statusCode?: number;
  };
};

async function createTemporaryAppResources() {
  const temporaryDirectoryPath = await mkdtemp(
    join(tmpdir(), "todo-ai-sandbox-backend-"),
  );

  return {
    databaseFilePath: join(temporaryDirectoryPath, "app.sqlite"),
    logFilePath: join(temporaryDirectoryPath, "app.log"),
    temporaryDirectoryPath,
  };
}

function parseLogEntries(logText: string): LogEntry[] {
  return logText
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as LogEntry);
}

describe("createApp", () => {
  it("開発基盤確認用の health check を返す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        status: "ok",
      });
    } finally {
      await app.close();
    }

    await rm(temporaryDirectoryPath, { force: true, recursive: true });
  });

  it("request のログをファイルへ永続化する", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      expect(response.statusCode).toBe(200);
    } finally {
      await app.close();
    }

    const logEntries = parseLogEntries(await readFile(logFilePath, "utf8"));

    expect(logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: "incoming request",
          req: expect.objectContaining({
            method: "GET",
            url: "/health",
          }),
          reqId: expect.any(String),
        }),
        expect.objectContaining({
          msg: "request completed",
          reqId: expect.any(String),
          res: expect.objectContaining({
            statusCode: 200,
          }),
        }),
      ]),
    );

    await rm(temporaryDirectoryPath, { force: true, recursive: true });
  });

  it("想定外エラーの stack trace をファイルへ残す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    app.get("/unexpected-error", async () => {
      throw new Error("想定外の失敗");
    });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/unexpected-error",
      });

      expect(response.statusCode).toBe(500);
    } finally {
      await app.close();
    }

    const logEntries = parseLogEntries(await readFile(logFilePath, "utf8"));

    expect(logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          err: expect.objectContaining({
            message: "想定外の失敗",
            stack: expect.stringContaining("Error: 想定外の失敗"),
          }),
          level: 50,
          reqId: expect.any(String),
        }),
      ]),
    );

    await rm(temporaryDirectoryPath, { force: true, recursive: true });
  });

  it("POST /todos で Todo を 1 件保存して返す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    let createdTodoResponse:
      | {
          todo: {
            createdAt: string;
            id: string;
            isCompleted: boolean;
            title: string;
            updatedAt: string;
          };
        }
      | undefined;

    try {
      const response = await app.inject({
        method: "POST",
        payload: {
          title: "  最初の Todo  ",
        },
        url: "/todos",
      });

      expect(response.statusCode).toBe(201);
      createdTodoResponse = response.json();
      expect(createdTodoResponse).toEqual({
        todo: {
          createdAt: expect.any(String),
          id: expect.any(String),
          isCompleted: false,
          title: "最初の Todo",
          updatedAt: expect.any(String),
        },
      });
    } finally {
      await app.close();
    }

    const databaseConnection = createDatabaseConnection({ databaseFilePath });

    try {
      const savedTodo = databaseConnection.client
        .prepare(
          "select id, title, is_completed as isCompleted from todos where id = ?",
        )
        .get(createdTodoResponse?.todo.id) as {
          id: string;
          isCompleted: number;
          title: string;
        };

      expect(savedTodo).toEqual({
        id: createdTodoResponse?.todo.id,
        isCompleted: 0,
        title: "最初の Todo",
      });
    } finally {
      databaseConnection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("POST /todos は空白だけの title を 400 で拒否する", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const response = await app.inject({
        method: "POST",
        payload: {
          title: "   ",
        },
        url: "/todos",
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        issues: [
          {
            field: "title",
            message: "title は空文字を許可しません。",
          },
        ],
        message: "入力が不正です。",
        requestId: expect.any(String),
      });
    } finally {
      await app.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("POST /todos は長すぎる title を 400 で拒否する", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const response = await app.inject({
        method: "POST",
        payload: {
          title: "a".repeat(todoTitleMaxLength + 1),
        },
        url: "/todos",
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        issues: [
          {
            field: "title",
            message: `title は ${todoTitleMaxLength} 文字以下である必要があります。`,
          },
        ],
        message: "入力が不正です。",
        requestId: expect.any(String),
      });
    } finally {
      await app.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("POST /todos の保存失敗時は 500 と requestId を返し、ログへ残す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({
      createTodoUseCase: {
        async execute() {
          throw new Error("保存に失敗しました");
        },
      },
      databaseFilePath,
      logFilePath,
    });

    try {
      const response = await app.inject({
        method: "POST",
        payload: {
          title: "保存失敗テスト",
        },
        url: "/todos",
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        message: "サーバーエラーが発生しました。",
        requestId: expect.any(String),
      });
    } finally {
      await app.close();
    }

    const logEntries = parseLogEntries(await readFile(logFilePath, "utf8"));

    expect(logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          err: expect.objectContaining({
            message: "保存に失敗しました",
            stack: expect.stringContaining("Error: 保存に失敗しました"),
          }),
          level: 50,
          req: expect.objectContaining({
            method: "POST",
            url: "/todos",
          }),
          reqId: expect.any(String),
        }),
      ]),
    );

    await rm(temporaryDirectoryPath, { force: true, recursive: true });
  });

  it("GET /todos は空の一覧を返す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/todos",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        todos: [],
      });
    } finally {
      await app.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("GET /todos は保存済み Todo 一覧を返す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const firstResponse = await app.inject({
        method: "POST",
        payload: {
          title: "最初の Todo",
        },
        url: "/todos",
      });
      const secondResponse = await app.inject({
        method: "POST",
        payload: {
          title: "二番目の Todo",
        },
        url: "/todos",
      });
      const firstTodo = firstResponse.json() as {
        todo: {
          createdAt: string;
          id: string;
          isCompleted: boolean;
          title: string;
          updatedAt: string;
        };
      };
      const secondTodo = secondResponse.json() as {
        todo: {
          createdAt: string;
          id: string;
          isCompleted: boolean;
          title: string;
          updatedAt: string;
        };
      };

      const response = await app.inject({
        method: "GET",
        url: "/todos",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        todos: [secondTodo.todo, firstTodo.todo],
      });
    } finally {
      await app.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("GET /todos の一覧取得失敗時は 500 と requestId を返し、ログへ残す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({
      databaseFilePath,
      getTodosUseCase: {
        async execute() {
          throw new Error("一覧取得に失敗しました");
        },
      },
      logFilePath,
    });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/todos",
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        message: "サーバーエラーが発生しました。",
        requestId: expect.any(String),
      });
    } finally {
      await app.close();
    }

    const logEntries = parseLogEntries(await readFile(logFilePath, "utf8"));

    expect(logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          err: expect.objectContaining({
            message: "一覧取得に失敗しました",
            stack: expect.stringContaining("Error: 一覧取得に失敗しました"),
          }),
          level: 50,
          req: expect.objectContaining({
            method: "GET",
            url: "/todos",
          }),
          reqId: expect.any(String),
        }),
      ]),
    );

    await rm(temporaryDirectoryPath, { force: true, recursive: true });
  });

  it("PATCH /todos/:id で Todo の完了状態を更新して返す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });
    let createdTodoId: string | undefined;

    try {
      const createdResponse = await app.inject({
        method: "POST",
        payload: {
          title: "完了更新する Todo",
        },
        url: "/todos",
      });
      const createdTodo = createdResponse.json() as {
        todo: {
          createdAt: string;
          id: string;
          isCompleted: boolean;
          title: string;
          updatedAt: string;
        };
      };
      createdTodoId = createdTodo.todo.id;

      const response = await app.inject({
        method: "PATCH",
        payload: {
          isCompleted: true,
        },
        url: `/todos/${createdTodo.todo.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        todo: {
          ...createdTodo.todo,
          isCompleted: true,
          updatedAt: expect.any(String),
        },
      });
    } finally {
      await app.close();
    }

    const databaseConnection = createDatabaseConnection({ databaseFilePath });

    try {
      expect(
        databaseConnection.client
          .prepare(
            "select id, is_completed as isCompleted from todos where id = ?",
          )
          .get(createdTodoId),
      ).toEqual({
        id: createdTodoId,
        isCompleted: 1,
      });
    } finally {
      databaseConnection.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("PATCH /todos/:id は存在しない Todo に 404 を返す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({ databaseFilePath, logFilePath });

    try {
      const response = await app.inject({
        method: "PATCH",
        payload: {
          isCompleted: true,
        },
        url: "/todos/missing-todo",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        message: "Todo が見つかりません。",
        requestId: expect.any(String),
      });
    } finally {
      await app.close();
      await rm(temporaryDirectoryPath, { force: true, recursive: true });
    }
  });

  it("PATCH /todos/:id の更新失敗時は 500 と requestId を返し、ログへ残す", async () => {
    const { databaseFilePath, logFilePath, temporaryDirectoryPath } =
      await createTemporaryAppResources();
    const app = createApp({
      databaseFilePath,
      logFilePath,
      updateTodoCompletionUseCase: {
        async execute() {
          throw new Error("完了更新に失敗しました");
        },
      },
    });

    try {
      const response = await app.inject({
        method: "PATCH",
        payload: {
          isCompleted: true,
        },
        url: "/todos/todo-1",
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        message: "サーバーエラーが発生しました。",
        requestId: expect.any(String),
      });
    } finally {
      await app.close();
    }

    const logEntries = parseLogEntries(await readFile(logFilePath, "utf8"));

    expect(logEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          err: expect.objectContaining({
            message: "完了更新に失敗しました",
            stack: expect.stringContaining("Error: 完了更新に失敗しました"),
          }),
          level: 50,
          req: expect.objectContaining({
            method: "PATCH",
            url: "/todos/todo-1",
          }),
          reqId: expect.any(String),
        }),
      ]),
    );

    await rm(temporaryDirectoryPath, { force: true, recursive: true });
  });
});
