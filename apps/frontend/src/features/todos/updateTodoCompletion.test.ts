import {
  createTodoCompletionUpdateError,
  updateTodoCompletion,
} from "./updateTodoCompletion";

describe("updateTodoCompletion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("PATCH /todos/:id の応答から更新済み Todo を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        todo: {
          createdAt: "2026-03-08T00:00:00.000Z",
          id: "todo-1",
          isCompleted: true,
          title: "切り替える Todo",
          updatedAt: "2026-03-10T00:00:00.000Z",
        },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateTodoCompletion("todo-1", true)).resolves.toEqual({
      createdAt: "2026-03-08T00:00:00.000Z",
      id: "todo-1",
      isCompleted: true,
      title: "切り替える Todo",
      updatedAt: "2026-03-10T00:00:00.000Z",
    });
    expect(fetchMock).toHaveBeenCalledWith("/todos/todo-1", {
      body: JSON.stringify({
        isCompleted: true,
      }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      method: "PATCH",
    });
  });

  it("404 応答では requestId 付きの Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          message: "Todo が見つかりません。",
          requestId: "req-complete-404",
        }),
        ok: false,
      }),
    );

    await expect(updateTodoCompletion("missing-todo", true)).rejects.toEqual(
      createTodoCompletionUpdateError("Todo が見つかりません。", {
        requestId: "req-complete-404",
      }),
    );
  });

  it("5xx 応答では requestId 付きの Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          message: "サーバーエラーが発生しました。",
          requestId: "req-complete-500",
        }),
        ok: false,
      }),
    );

    await expect(updateTodoCompletion("todo-1", false)).rejects.toEqual(
      createTodoCompletionUpdateError("サーバーエラーが発生しました。", {
        requestId: "req-complete-500",
      }),
    );
  });
});
