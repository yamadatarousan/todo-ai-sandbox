import type { FastifyInstance } from "fastify";
import { todoTitleMaxLength } from "../database/schema";
import {
  badRequestErrorResponseSchema,
  internalServerErrorResponseSchema,
  notFoundErrorResponseSchema,
  type ErrorResponse,
} from "../shared/requestError";
import type { CreateTodoUseCase } from "../use-cases/createTodoUseCase";
import type { DeleteTodoUseCase } from "../use-cases/deleteTodoUseCase";
import type { GetTodosUseCase } from "../use-cases/getTodosUseCase";
import type { UpdateTodoCompletionUseCase } from "../use-cases/updateTodoCompletionUseCase";

type RegisterTodoRoutesOptions = {
  createTodoUseCase: CreateTodoUseCase;
  deleteTodoUseCase: DeleteTodoUseCase;
  getTodosUseCase: GetTodosUseCase;
  updateTodoCompletionUseCase: UpdateTodoCompletionUseCase;
};

type CreateTodoRequestBody = {
  title: string;
};

type CreateTodoSuccessResponse = {
  todo: {
    createdAt: string;
    id: string;
    isCompleted: boolean;
    title: string;
    updatedAt: string;
  };
};

type TodoSuccessResponse = CreateTodoSuccessResponse;
type CreateTodoRouteReply = TodoSuccessResponse | ErrorResponse;
type GetTodosSuccessResponse = {
  todos: TodoSuccessResponse["todo"][];
};
type GetTodosRouteReply = GetTodosSuccessResponse | ErrorResponse;
type UpdateTodoCompletionRequestParams = {
  id: string;
};
type UpdateTodoCompletionRequestBody = {
  isCompleted: boolean;
};
type UpdateTodoCompletionRouteReply = TodoSuccessResponse | ErrorResponse;
type DeleteTodoRequestParams = {
  id: string;
};
type DeleteTodoSuccessResponse = {
  deletedTodoId: string;
};
type DeleteTodoRouteReply = DeleteTodoSuccessResponse | ErrorResponse;

const createTodoBodySchema = {
  additionalProperties: false,
  properties: {
    title: {
      maxLength: todoTitleMaxLength,
      pattern: "\\S",
      type: "string",
    },
  },
  required: ["title"],
  type: "object",
} as const;

const todoSuccessResponseSchema = {
  additionalProperties: false,
  properties: {
    todo: {
      additionalProperties: false,
      properties: {
        createdAt: {
          format: "date-time",
          type: "string",
        },
        id: { type: "string" },
        isCompleted: { type: "boolean" },
        title: { type: "string" },
        updatedAt: {
          format: "date-time",
          type: "string",
        },
      },
      required: ["id", "title", "isCompleted", "createdAt", "updatedAt"],
      type: "object",
    },
  },
  required: ["todo"],
  type: "object",
} as const;

const getTodosSuccessResponseSchema = {
  additionalProperties: false,
  properties: {
    todos: {
      items: todoSuccessResponseSchema.properties.todo,
      type: "array",
    },
  },
  required: ["todos"],
  type: "object",
} as const;

const updateTodoCompletionParamsSchema = {
  additionalProperties: false,
  properties: {
    id: {
      minLength: 1,
      pattern: "\\S",
      type: "string",
    },
  },
  required: ["id"],
  type: "object",
} as const;

const updateTodoCompletionBodySchema = {
  additionalProperties: false,
  properties: {
    isCompleted: { type: "boolean" },
  },
  required: ["isCompleted"],
  type: "object",
} as const;

const deleteTodoSuccessResponseSchema = {
  additionalProperties: false,
  properties: {
    deletedTodoId: { type: "string" },
  },
  required: ["deletedTodoId"],
  type: "object",
} as const;

export function registerTodoRoutes(
  app: FastifyInstance<any, any, any, any>,
  options: RegisterTodoRoutesOptions,
) {
  app.get<{
    Reply: GetTodosRouteReply;
  }>(
    "/todos",
    {
      schema: {
        response: {
          200: getTodosSuccessResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async () => {
      const todos = await options.getTodosUseCase.execute();

      return {
        todos: todos.map((todo) => ({
          createdAt: todo.createdAt.toISOString(),
          id: todo.id,
          isCompleted: todo.isCompleted,
          title: todo.title,
          updatedAt: todo.updatedAt.toISOString(),
        })),
      };
    },
  );

  app.post<{
    Body: CreateTodoRequestBody;
    Reply: CreateTodoRouteReply;
  }>(
    "/todos",
    {
      schema: {
        body: createTodoBodySchema,
        response: {
          201: todoSuccessResponseSchema,
          400: badRequestErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const createdTodo = await options.createTodoUseCase.execute(request.body);

      return reply.status(201).send({
        todo: {
          createdAt: createdTodo.createdAt.toISOString(),
          id: createdTodo.id,
          isCompleted: createdTodo.isCompleted,
          title: createdTodo.title,
          updatedAt: createdTodo.updatedAt.toISOString(),
        },
      });
    },
  );

  app.patch<{
    Body: UpdateTodoCompletionRequestBody;
    Params: UpdateTodoCompletionRequestParams;
    Reply: UpdateTodoCompletionRouteReply;
  }>(
    "/todos/:id",
    {
      schema: {
        body: updateTodoCompletionBodySchema,
        params: updateTodoCompletionParamsSchema,
        response: {
          200: todoSuccessResponseSchema,
          400: badRequestErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request) => {
      const updatedTodo = await options.updateTodoCompletionUseCase.execute({
        id: request.params.id,
        isCompleted: request.body.isCompleted,
      });

      return {
        todo: {
          createdAt: updatedTodo.createdAt.toISOString(),
          id: updatedTodo.id,
          isCompleted: updatedTodo.isCompleted,
          title: updatedTodo.title,
          updatedAt: updatedTodo.updatedAt.toISOString(),
        },
      };
    },
  );

  app.delete<{
    Params: DeleteTodoRequestParams;
    Reply: DeleteTodoRouteReply;
  }>(
    "/todos/:id",
    {
      schema: {
        params: updateTodoCompletionParamsSchema,
        response: {
          200: deleteTodoSuccessResponseSchema,
          400: badRequestErrorResponseSchema,
          404: notFoundErrorResponseSchema,
          500: internalServerErrorResponseSchema,
        },
      },
    },
    async (request) => {
      await options.deleteTodoUseCase.execute({
        id: request.params.id,
      });

      return {
        deletedTodoId: request.params.id,
      };
    },
  );
}
