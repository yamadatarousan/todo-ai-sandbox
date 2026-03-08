import { fetchTodos, TodoListLoadError } from "./fetchTodos";

describe("fetchTodos", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /todos の応答から Todo 一覧を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        todos: [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-1",
            isCompleted: false,
            title: "最初の Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
        ],
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchTodos()).resolves.toEqual([
      {
        createdAt: "2026-03-08T00:00:00.000Z",
        id: "todo-1",
        isCompleted: false,
        title: "最初の Todo",
        updatedAt: "2026-03-08T00:00:00.000Z",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith("/todos", {
      headers: {
        accept: "application/json",
      },
    });
  });

  it("失敗応答では requestId 付きの Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          message: "サーバーエラーが発生しました。",
          requestId: "req-backend-1",
        }),
        ok: false,
      }),
    );

    await expect(fetchTodos()).rejects.toEqual(
      new TodoListLoadError("サーバーエラーが発生しました。", {
        requestId: "req-backend-1",
      }),
    );
  });
});
