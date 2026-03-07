import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

async function createTemporaryLogFilePath() {
  const temporaryDirectoryPath = await mkdtemp(
    join(tmpdir(), "todo-ai-sandbox-backend-"),
  );

  return {
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
    const { logFilePath, temporaryDirectoryPath } =
      await createTemporaryLogFilePath();
    const app = createApp({ logFilePath });

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
    const { logFilePath, temporaryDirectoryPath } =
      await createTemporaryLogFilePath();
    const app = createApp({ logFilePath });

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
    const { logFilePath, temporaryDirectoryPath } =
      await createTemporaryLogFilePath();
    const app = createApp({ logFilePath });

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
});
