import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import { createTodoSaveError } from "./features/todos/createTodo";
import { TodoListLoadError, type TodoSummary } from "./features/todos/fetchTodos";
import { createTodoCompletionUpdateError } from "./features/todos/updateTodoCompletion";

function createDeferredPromise<T>() {
  let reject: (reason?: unknown) => void = () => {};
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe("App", () => {
  it("Todo 一覧の読み込み中表示を出す", () => {
    const deferred = createDeferredPromise<TodoSummary[]>();

    render(
      <App
        loadTodos={() => deferred.promise}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Todo AI Sandbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Todo を読み込んでいます。"),
    ).toBeInTheDocument();
  });

  it("Todo がないときは空状態を表示する", async () => {
    render(
      <App
        loadTodos={async () => []}
      />,
    );

    expect(
      await screen.findByText("Todo はまだありません。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("最初の 1 件を追加して、保存結果をここで確認できます。"),
    ).toBeInTheDocument();
  });

  it("保存済み Todo 一覧を表示する", async () => {
    render(
      <App
        loadTodos={async () => [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-2",
            isCompleted: true,
            title: "二番目の Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
          {
            createdAt: "2026-03-07T00:00:00.000Z",
            id: "todo-1",
            isCompleted: false,
            title: "最初の Todo",
            updatedAt: "2026-03-07T00:00:00.000Z",
          },
        ]}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "二番目の Todo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "最初の Todo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("2 件の Todo を表示しています。"),
    ).toBeInTheDocument();
  });

  it("一覧取得失敗時は失敗表示と requestId を出す", async () => {
    render(
      <App
        loadTodos={async () => {
          throw new TodoListLoadError(
            "Todo 一覧の取得に失敗しました。",
            { requestId: "req-frontend-1" },
          );
        }}
      />,
    );

    expect(
      await screen.findByText("Todo 一覧の取得に失敗しました。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("requestId: req-frontend-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("成功したようには扱わず、失敗として表示しています。"),
    ).toBeInTheDocument();
  });

  it("Todo 追加中は保存中表示を出し、成功後に一覧へ反映する", async () => {
    const deferred = createDeferredPromise<TodoSummary>();
    const saveTodo = vi.fn().mockImplementation(() => deferred.promise);

    render(
      <App
        loadTodos={async () => []}
        saveTodo={saveTodo}
      />,
    );

    await screen.findByText("Todo はまだありません。");

    fireEvent.change(screen.getByLabelText("新しい Todo"), {
      target: { value: "追加する Todo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Todo を追加する" }));

    expect(saveTodo).toHaveBeenCalledWith("追加する Todo");
    expect(
      screen.getByRole("button", { name: "保存中..." }),
    ).toBeDisabled();

    deferred.resolve({
      createdAt: "2026-03-09T00:00:00.000Z",
      id: "todo-new",
      isCompleted: false,
      title: "追加する Todo",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    expect(
      await screen.findByRole("heading", { name: "追加する Todo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 件の Todo を表示しています。"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("新しい Todo")).toHaveValue("");
  });

  it("保存が 4xx で失敗したときはフォーム周辺に失敗表示を出し、一覧は壊さない", async () => {
    render(
      <App
        loadTodos={async () => [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-1",
            isCompleted: false,
            title: "既存の Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
        ]}
        saveTodo={async () => {
          throw createTodoSaveError("入力が不正です。", {
            issues: [
              {
                field: "title",
                message: "title は空文字を許可しません。",
              },
            ],
            requestId: "req-save-400",
          });
        }}
      />,
    );

    await screen.findByRole("heading", { name: "既存の Todo" });

    fireEvent.change(screen.getByLabelText("新しい Todo"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Todo を追加する" }));

    expect(await screen.findByText("入力が不正です。")).toBeInTheDocument();
    expect(
      screen.getByText("title は空文字を許可しません。"),
    ).toBeInTheDocument();
    expect(screen.getByText("requestId: req-save-400")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "既存の Todo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 件の Todo を表示しています。")).toBeInTheDocument();
  });

  it("保存が 5xx で失敗したときは成功したように見せず、一覧も維持する", async () => {
    render(
      <App
        loadTodos={async () => [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-1",
            isCompleted: false,
            title: "既存の Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
        ]}
        saveTodo={async () => {
          throw createTodoSaveError("サーバーエラーが発生しました。", {
            requestId: "req-save-500",
          });
        }}
      />,
    );

    await screen.findByRole("heading", { name: "既存の Todo" });

    fireEvent.change(screen.getByLabelText("新しい Todo"), {
      target: { value: "保存に失敗する Todo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Todo を追加する" }));

    expect(
      await screen.findByText("サーバーエラーが発生しました。"),
    ).toBeInTheDocument();
    expect(screen.getByText("requestId: req-save-500")).toBeInTheDocument();
    expect(
      screen.getByText("保存に失敗したため、一覧は成功扱いに更新していません。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "既存の Todo" }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "保存に失敗する Todo" }),
      ).not.toBeInTheDocument();
    });
  });

  it("Todo の完了切り替え中は更新中表示を出し、成功後に対象行だけ更新する", async () => {
    const deferred = createDeferredPromise<TodoSummary>();
    const updateTodoCompletion = vi.fn().mockImplementation(() => deferred.promise);

    render(
      <App
        loadTodos={async () => [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-1",
            isCompleted: false,
            title: "切り替える Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
          {
            createdAt: "2026-03-07T00:00:00.000Z",
            id: "todo-2",
            isCompleted: false,
            title: "そのままの Todo",
            updatedAt: "2026-03-07T00:00:00.000Z",
          },
        ]}
        updateTodoCompletion={updateTodoCompletion}
      />,
    );

    await screen.findByRole("heading", { name: "切り替える Todo" });

    fireEvent.click(screen.getAllByRole("button", { name: "完了にする" })[0]);

    expect(updateTodoCompletion).toHaveBeenCalledWith("todo-1", true);
    expect(
      screen.getByRole("button", { name: "更新中..." }),
    ).toBeDisabled();

    deferred.resolve({
      createdAt: "2026-03-08T00:00:00.000Z",
      id: "todo-1",
      isCompleted: true,
      title: "切り替える Todo",
      updatedAt: "2026-03-10T00:00:00.000Z",
    });

    expect(await screen.findByText("完了")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "未完了に戻す" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "そのままの Todo" }),
    ).toBeInTheDocument();
  });

  it("完了切り替えが 404 で失敗したときは対象行に失敗表示を出し、状態は変えない", async () => {
    render(
      <App
        loadTodos={async () => [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-1",
            isCompleted: false,
            title: "見つからない Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
        ]}
        updateTodoCompletion={async () => {
          throw createTodoCompletionUpdateError("Todo が見つかりません。", {
            requestId: "req-complete-404",
          });
        }}
      />,
    );

    await screen.findByRole("heading", { name: "見つからない Todo" });

    fireEvent.click(screen.getByRole("button", { name: "完了にする" }));

    expect(await screen.findByText("Todo が見つかりません。")).toBeInTheDocument();
    expect(screen.getByText("requestId: req-complete-404")).toBeInTheDocument();
    expect(
      screen.getByText("更新に失敗したため、この Todo の表示は切り替えていません。"),
    ).toBeInTheDocument();
    expect(screen.getByText("未完了")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "完了にする" }),
    ).toBeInTheDocument();
  });

  it("完了切り替えが 5xx で失敗したときも対象行だけに失敗表示を出す", async () => {
    render(
      <App
        loadTodos={async () => [
          {
            createdAt: "2026-03-08T00:00:00.000Z",
            id: "todo-1",
            isCompleted: true,
            title: "更新失敗する Todo",
            updatedAt: "2026-03-08T00:00:00.000Z",
          },
          {
            createdAt: "2026-03-07T00:00:00.000Z",
            id: "todo-2",
            isCompleted: false,
            title: "別の Todo",
            updatedAt: "2026-03-07T00:00:00.000Z",
          },
        ]}
        updateTodoCompletion={async () => {
          throw createTodoCompletionUpdateError("サーバーエラーが発生しました。", {
            requestId: "req-complete-500",
          });
        }}
      />,
    );

    await screen.findByRole("heading", { name: "更新失敗する Todo" });

    fireEvent.click(screen.getByRole("button", { name: "未完了に戻す" }));

    expect(
      await screen.findByText("サーバーエラーが発生しました。"),
    ).toBeInTheDocument();
    expect(screen.getByText("requestId: req-complete-500")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "未完了に戻す" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "別の Todo" })).toBeInTheDocument();
  });
});
