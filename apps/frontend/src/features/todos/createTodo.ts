import type { TodoSummary } from "./fetchTodos";

export type TodoSaveIssue = {
  field: string;
  message: string;
};

type CreateTodoSuccessResponse = {
  todo: TodoSummary;
};

type ErrorResponse = {
  issues?: TodoSaveIssue[];
  message: string;
  requestId?: string;
};

export class TodoSaveError extends Error {
  readonly issues: TodoSaveIssue[];
  readonly requestId?: string;

  constructor(
    message: string,
    options: { issues?: TodoSaveIssue[]; requestId?: string } = {},
  ) {
    super(message);
    this.name = "TodoSaveError";
    this.issues = options.issues ?? [];
    this.requestId = options.requestId;
  }
}

export function createTodoSaveError(
  message: string,
  options: { issues?: TodoSaveIssue[]; requestId?: string } = {},
) {
  return new TodoSaveError(message, options);
}

export async function createTodo(title: string): Promise<TodoSummary> {
  try {
    const response = await fetch("/todos", {
      body: JSON.stringify({
        title,
      }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      method: "POST",
    });
    const responseBody = (await response.json()) as unknown;

    if (!response.ok) {
      const errorResponse = parseErrorResponse(responseBody);

      throw createTodoSaveError(
        errorResponse?.message ?? "Todo の保存に失敗しました。",
        {
          issues: errorResponse?.issues,
          requestId: errorResponse?.requestId,
        },
      );
    }

    const successResponse = parseCreateTodoSuccessResponse(responseBody);

    if (!successResponse) {
      throw createTodoSaveError("Todo の保存に失敗しました。");
    }

    return successResponse.todo;
  } catch (error) {
    if (error instanceof TodoSaveError) {
      throw error;
    }

    throw createTodoSaveError("Todo の保存に失敗しました。");
  }
}

function parseCreateTodoSuccessResponse(
  value: unknown,
): CreateTodoSuccessResponse | undefined {
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
  const issues = "issues" in value ? value.issues : undefined;

  if (typeof message !== "string") {
    return undefined;
  }

  if (requestId !== undefined && typeof requestId !== "string") {
    return undefined;
  }

  if (issues !== undefined) {
    if (!Array.isArray(issues)) {
      return undefined;
    }

    if (!issues.every(isTodoSaveIssue)) {
      return undefined;
    }
  }

  return {
    issues,
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

function isTodoSaveIssue(value: unknown): value is TodoSaveIssue {
  if (!value || typeof value !== "object") {
    return false;
  }

  const issue = value as Record<string, unknown>;

  return (
    typeof issue.field === "string" && typeof issue.message === "string"
  );
}
