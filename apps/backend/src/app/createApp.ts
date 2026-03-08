import Fastify, { type FastifySchemaValidationError } from "fastify";
import { createDatabaseConnection, type CreateDatabaseConnectionOptions } from "../database/createDatabaseConnection";
import { runMigrations } from "../database/migrate";
import { createSqliteTodoRepository } from "../repositories/createSqliteTodoRepository";
import {
  ClientInputError,
  createBadRequestErrorResponse,
  createInternalServerErrorResponse,
  createNotFoundErrorResponse,
  mapValidationIssues,
  ResourceNotFoundError,
} from "../shared/requestError";
import { registerTodoRoutes } from "../routes/registerTodoRoutes";
import { createTodoUseCase, type CreateTodoUseCase } from "../use-cases/createTodoUseCase";
import { getTodosUseCase, type GetTodosUseCase } from "../use-cases/getTodosUseCase";
import {
  updateTodoCompletionUseCase,
  type UpdateTodoCompletionUseCase,
} from "../use-cases/updateTodoCompletionUseCase";
import { createBackendLogger, type CreateBackendLoggerOptions } from "./createLogger";

export type CreateAppOptions = CreateBackendLoggerOptions &
  CreateDatabaseConnectionOptions & {
    createTodoUseCase?: CreateTodoUseCase;
    getTodosUseCase?: GetTodosUseCase;
    updateTodoCompletionUseCase?: UpdateTodoCompletionUseCase;
  };

export function createApp(options: CreateAppOptions = {}) {
  const backendLogger = createBackendLogger(options);
  const app = Fastify({
    loggerInstance: backendLogger.logger,
  });
  let databaseConnection:
    | ReturnType<typeof createDatabaseConnection>
    | undefined;
  const resolvedTodoRepository = (() => {
    if (
      options.createTodoUseCase &&
      options.getTodosUseCase &&
      options.updateTodoCompletionUseCase
    ) {
      return undefined;
    }

    databaseConnection = createDatabaseConnection({
      databaseFilePath: options.databaseFilePath,
    });
    runMigrations(databaseConnection.client);

    return createSqliteTodoRepository({
      database: databaseConnection.db,
    });
  })();
  const resolvedCreateTodoUseCase =
    options.createTodoUseCase ??
    createTodoUseCase({
      todoRepository: resolvedTodoRepository!,
    });
  const resolvedGetTodosUseCase =
    options.getTodosUseCase ??
    getTodosUseCase({
      todoRepository: resolvedTodoRepository!,
    });
  const resolvedUpdateTodoCompletionUseCase =
    options.updateTodoCompletionUseCase ??
    updateTodoCompletionUseCase({
      todoRepository: resolvedTodoRepository!,
    });

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

    if (error instanceof ResourceNotFoundError) {
      return reply
        .status(404)
        .send(createNotFoundErrorResponse(request.id, error.message));
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
    getTodosUseCase: resolvedGetTodosUseCase,
    updateTodoCompletionUseCase: resolvedUpdateTodoCompletionUseCase,
  });

  return app;
}
