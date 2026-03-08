import Fastify, { type FastifySchemaValidationError } from "fastify";
import { createDatabaseConnection, type CreateDatabaseConnectionOptions } from "../database/createDatabaseConnection";
import { runMigrations } from "../database/migrate";
import { createSqliteTodoRepository } from "../repositories/createSqliteTodoRepository";
import {
  ClientInputError,
  createBadRequestErrorResponse,
  createInternalServerErrorResponse,
  mapValidationIssues,
} from "../shared/requestError";
import { registerTodoRoutes } from "../routes/registerTodoRoutes";
import { createTodoUseCase, type CreateTodoUseCase } from "../use-cases/createTodoUseCase";
import { createBackendLogger, type CreateBackendLoggerOptions } from "./createLogger";

export type CreateAppOptions = CreateBackendLoggerOptions &
  CreateDatabaseConnectionOptions & {
    createTodoUseCase?: CreateTodoUseCase;
  };

export function createApp(options: CreateAppOptions = {}) {
  const backendLogger = createBackendLogger(options);
  const app = Fastify({
    loggerInstance: backendLogger.logger,
  });
  let databaseConnection:
    | ReturnType<typeof createDatabaseConnection>
    | undefined;
  const resolvedCreateTodoUseCase =
    options.createTodoUseCase ??
    (() => {
      databaseConnection = createDatabaseConnection({
        databaseFilePath: options.databaseFilePath,
      });
      runMigrations(databaseConnection.client);

      return createTodoUseCase({
        todoRepository: createSqliteTodoRepository({
          database: databaseConnection.db,
        }),
      });
    })();

  app.addHook("onClose", () => {
    databaseConnection?.close();
    backendLogger.close();
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ClientInputError) {
      return reply
        .status(400)
        .send(createBadRequestErrorResponse(request.id, error.issues));
    }

    const validationError = error as {
      validation?: FastifySchemaValidationError[];
    };

    if (Array.isArray(validationError.validation)) {
      return reply.status(400).send(
        createBadRequestErrorResponse(
          request.id,
          mapValidationIssues(
            validationError.validation,
          ),
        ),
      );
    }

    request.log.error(
      {
        err: error,
        req: {
          method: request.method,
          url: request.url,
        },
      },
      "想定外の失敗",
    );

    return reply
      .status(500)
      .send(createInternalServerErrorResponse(request.id));
  });

  // 開発基盤の確認用に、最小の応答を返す。
  app.get("/health", async () => {
    return {
      status: "ok",
    };
  });
  registerTodoRoutes(app, {
    createTodoUseCase: resolvedCreateTodoUseCase,
  });

  return app;
}
