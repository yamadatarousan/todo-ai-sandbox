import type { TodoSummary } from "./fetchTodos";

type UpdateTodoCompletionSuccessResponse = {
  todo: TodoSummary;
};

type ErrorResponse = {
  message: string;
  requestId?: string;
};

export class TodoCompletionUpdateError extends Error {
  readonly requestId?: string;

  constructor(message: string, options: { requestId?: string } = {}) {
    super(message);
    this.name = "TodoCompletionUpdateError";
    this.requestId = options.requestId;
  }
}

export function createTodoCompletionUpdateError(
  message: string,
  options: { requestId?: string } = {},
) {
  return new TodoCompletionUpdateError(message, options);
}

export async function updateTodoCompletion(
  id: string,
  isCompleted: boolean,
): Promise<TodoSummary> {
  try {
    const response = await fetch(`/todos/${encodeURIComponent(id)}`, {
      body: JSON.stringify({
        isCompleted,
      }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      method: "PATCH",
    });
    const responseBody = (await response.json()) as unknown;

    if (!response.ok) {
      const errorResponse = parseErrorResponse(responseBody);

      throw createTodoCompletionUpdateError(
        errorResponse?.message ?? "Todo の更新に失敗しました。",
        { requestId: errorResponse?.requestId },
      );
    }

    const successResponse = parseUpdateTodoCompletionSuccessResponse(responseBody);

    if (!successResponse) {
      throw createTodoCompletionUpdateError("Todo の更新に失敗しました。");
    }

    return successResponse.todo;
  } catch (error) {
    if (error instanceof TodoCompletionUpdateError) {
      throw error;
    }

    throw createTodoCompletionUpdateError("Todo の更新に失敗しました。");
  }
}

function parseUpdateTodoCompletionSuccessResponse(
  value: unknown,
): UpdateTodoCompletionSuccessResponse | undefined {
  if (!value || typeof value !== "object" || !("todo" in value)) {
    return undefined;
  }

  const todo = value.todo;

  if (!isTodoSummary(todo)) {
    return undefined;
  }

  return {
    todo,
  };
}

function parseErrorResponse(value: unknown): ErrorResponse | undefined {
  if (!value || typeof value !== "object" || !("message" in value)) {
    return undefined;
  }

  const message = value.message;
  const requestId = "requestId" in value ? value.requestId : undefined;

  if (typeof message !== "string") {
    return undefined;
  }

  if (requestId !== undefined && typeof requestId !== "string") {
    return undefined;
  }

  return {
    message,
    requestId,
  };
}

function isTodoSummary(value: unknown): value is TodoSummary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const todo = value as Record<string, unknown>;

  return (
    typeof todo.createdAt === "string" &&
    typeof todo.id === "string" &&
    typeof todo.isCompleted === "boolean" &&
    typeof todo.title === "string" &&
    typeof todo.updatedAt === "string"
  );
}
