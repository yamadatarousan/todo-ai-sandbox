import pino, { type LevelWithSilent, type Logger } from "pino";
import { fileURLToPath } from "node:url";

export type CreateBackendLoggerOptions = {
  level?: LevelWithSilent;
  logFilePath?: string;
};

export const defaultBackendLogFilePath = fileURLToPath(
  new URL("../../../../logs/backend/app.log", import.meta.url),
);

type BackendLoggerBundle = {
  close: () => void;
  logFilePath: string;
  logger: Logger;
};

export function createBackendLogger(
  options: CreateBackendLoggerOptions = {},
): BackendLoggerBundle {
  const logFilePath = options.logFilePath ?? defaultBackendLogFilePath;

  // 学習用の段階では、速度より「失敗時の証拠を確実に残す」ことを優先する。
  const fileDestination = pino.destination({
    dest: logFilePath,
    mkdir: true,
    sync: true,
  });

  const logger = pino(
    {
      level: options.level ?? "info",
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream(
      [
        { level: "info", stream: process.stdout },
        { level: "error", stream: process.stderr },
        { level: "info", stream: fileDestination },
      ],
      { dedupe: false },
    ),
  );

  return {
    close() {
      fileDestination.flushSync();
      fileDestination.end();
    },
    logFilePath,
    logger,
  };
}
