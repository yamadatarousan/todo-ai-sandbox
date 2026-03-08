import type { FastifyInstance } from "fastify";
import { todoTitleMaxLength } from "../database/schema";
import {
  badRequestErrorResponseSchema,
  internalServerErrorResponseSchema,
  type ErrorResponse,
} from "../shared/requestError";
import type { CreateTodoUseCase } from "../use-cases/createTodoUseCase";
import type { GetTodosUseCase } from "../use-cases/getTodosUseCase";

type RegisterTodoRoutesOptions = {
  createTodoUseCase: CreateTodoUseCase;
  getTodosUseCase: GetTodosUseCase;
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

type CreateTodoRouteReply = CreateTodoSuccessResponse | ErrorResponse;
type GetTodosSuccessResponse = {
  todos: CreateTodoSuccessResponse["todo"][];
};
type GetTodosRouteReply = GetTodosSuccessResponse | ErrorResponse;

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

const createTodoSuccessResponseSchema = {
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
      items: createTodoSuccessResponseSchema.properties.todo,
      type: "array",
    },
  },
  required: ["todos"],
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
          201: createTodoSuccessResponseSchema,
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
}
