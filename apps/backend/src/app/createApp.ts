import Fastify from "fastify";
import { createBackendLogger, type CreateBackendLoggerOptions } from "./createLogger";

export type CreateAppOptions = CreateBackendLoggerOptions;

export function createApp(options: CreateAppOptions = {}) {
  const backendLogger = createBackendLogger(options);
  const app = Fastify({
    loggerInstance: backendLogger.logger,
  });

  app.addHook("onClose", () => {
    backendLogger.close();
  });

  // 開発基盤の確認用に、最小の応答を返す。
  app.get("/health", async () => {
    return {
      status: "ok",
    };
  });

  return app;
}
