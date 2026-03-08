type DeleteTodoSuccessResponse = {
  deletedTodoId: string;
};

type ErrorResponse = {
  message: string;
  requestId?: string;
};

export class TodoDeleteError extends Error {
  readonly requestId?: string;

  constructor(message: string, options: { requestId?: string } = {}) {
    super(message);
    this.name = "TodoDeleteError";
    this.requestId = options.requestId;
  }
}

export function createTodoDeleteError(
  message: string,
  options: { requestId?: string } = {},
) {
  return new TodoDeleteError(message, options);
}

export async function deleteTodo(id: string): Promise<string> {
  try {
    const response = await fetch(`/todos/${encodeURIComponent(id)}`, {
      headers: {
        accept: "application/json",
      },
      method: "DELETE",
    });
    const responseBody = (await response.json()) as unknown;

    if (!response.ok) {
      const errorResponse = parseErrorResponse(responseBody);

      throw createTodoDeleteError(
        errorResponse?.message ?? "Todo の削除に失敗しました。",
        { requestId: errorResponse?.requestId },
      );
    }

    const successResponse = parseDeleteTodoSuccessResponse(responseBody);

    if (!successResponse) {
      throw createTodoDeleteError("Todo の削除に失敗しました。");
    }

    return successResponse.deletedTodoId;
  } catch (error) {
    if (error instanceof TodoDeleteError) {
      throw error;
    }

    throw createTodoDeleteError("Todo の削除に失敗しました。");
  }
}

function parseDeleteTodoSuccessResponse(
  value: unknown,
): DeleteTodoSuccessResponse | undefined {
  if (!value || typeof value !== "object" || !("deletedTodoId" in value)) {
    return undefined;
  }

  if (typeof value.deletedTodoId !== "string") {
    return undefined;
  }

  return {
    deletedTodoId: value.deletedTodoId,
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
