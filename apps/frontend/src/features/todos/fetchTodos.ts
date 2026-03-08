export type TodoSummary = {
  createdAt: string;
  id: string;
  isCompleted: boolean;
  title: string;
  updatedAt: string;
};

type TodoListResponse = {
  todos: TodoSummary[];
};

type ErrorResponse = {
  message: string;
  requestId?: string;
};

export class TodoListLoadError extends Error {
  readonly requestId?: string;

  constructor(message: string, options: { requestId?: string } = {}) {
    super(message);
    this.name = "TodoListLoadError";
    this.requestId = options.requestId;
  }
}

export async function fetchTodos(): Promise<TodoSummary[]> {
  try {
    const response = await fetch("/todos", {
      headers: {
        accept: "application/json",
      },
    });
    const responseBody = (await response.json()) as unknown;

    if (!response.ok) {
      const errorResponse = parseErrorResponse(responseBody);

      throw new TodoListLoadError(
        errorResponse?.message ?? "Todo 一覧の取得に失敗しました。",
        { requestId: errorResponse?.requestId },
      );
    }

    const todoListResponse = parseTodoListResponse(responseBody);

    if (!todoListResponse) {
      throw new TodoListLoadError("Todo 一覧の取得に失敗しました。");
    }

    return todoListResponse.todos;
  } catch (error) {
    if (error instanceof TodoListLoadError) {
      throw error;
    }

    throw new TodoListLoadError("Todo 一覧の取得に失敗しました。");
  }
}

function parseTodoListResponse(value: unknown): TodoListResponse | undefined {
  if (!value || typeof value !== "object" || !("todos" in value)) {
    return undefined;
  }

  const todos = value.todos;

  if (!Array.isArray(todos)) {
    return undefined;
  }

  if (!todos.every(isTodoSummary)) {
    return undefined;
  }

  return {
    todos,
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
