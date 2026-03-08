import { createTodo, createTodoSaveError } from "./createTodo";

describe("createTodo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /todos の応答から保存した Todo を返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        todo: {
          createdAt: "2026-03-09T00:00:00.000Z",
          id: "todo-new",
          isCompleted: false,
          title: "追加する Todo",
          updatedAt: "2026-03-09T00:00:00.000Z",
        },
      }),
      ok: true,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(createTodo("追加する Todo")).resolves.toEqual({
      createdAt: "2026-03-09T00:00:00.000Z",
      id: "todo-new",
      isCompleted: false,
      title: "追加する Todo",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    expect(fetchMock).toHaveBeenCalledWith("/todos", {
      body: JSON.stringify({
        title: "追加する Todo",
      }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      method: "POST",
    });
  });

  it("4xx 応答では issue と requestId を持つ Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          issues: [
            {
              field: "title",
              message: "title は空文字を許可しません。",
            },
          ],
          message: "入力が不正です。",
          requestId: "req-save-400",
        }),
        ok: false,
      }),
    );

    await expect(createTodo("   ")).rejects.toEqual(
      createTodoSaveError("入力が不正です。", {
        issues: [
          {
            field: "title",
            message: "title は空文字を許可しません。",
          },
        ],
        requestId: "req-save-400",
      }),
    );
  });

  it("5xx 応答では requestId 付きの Error を投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          message: "サーバーエラーが発生しました。",
          requestId: "req-save-500",
        }),
        ok: false,
      }),
    );

    await expect(createTodo("保存に失敗する Todo")).rejects.toEqual(
      createTodoSaveError("サーバーエラーが発生しました。", {
        requestId: "req-save-500",
      }),
    );
  });
});
