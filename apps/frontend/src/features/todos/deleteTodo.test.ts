import { createTodoDeleteError, deleteTodo } from "./deleteTodo";

describe("deleteTodo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("DELETE /todos/:id の応答から削除済み Todo の id を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        deletedTodoId: "todo-1",
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteTodo("todo-1")).resolves.toBe("todo-1");
    expect(fetchMock).toHaveBeenCalledWith("/todos/todo-1", {
      headers: {
        accept: "application/json",
      },
      method: "DELETE",
    });
  });

  it("404 応答では requestId 付きの Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          message: "Todo が見つかりません。",
          requestId: "req-delete-404",
        }),
        ok: false,
      }),
    );

    await expect(deleteTodo("missing-todo")).rejects.toEqual(
      createTodoDeleteError("Todo が見つかりません。", {
        requestId: "req-delete-404",
      }),
    );
  });

  it("5xx 応答では requestId 付きの Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          message: "サーバーエラーが発生しました。",
          requestId: "req-delete-500",
        }),
        ok: false,
      }),
    );

    await expect(deleteTodo("todo-1")).rejects.toEqual(
      createTodoDeleteError("サーバーエラーが発生しました。", {
        requestId: "req-delete-500",
      }),
    );
  });
});
