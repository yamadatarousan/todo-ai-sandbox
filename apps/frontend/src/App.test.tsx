import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { TodoListLoadError, type TodoSummary } from "./features/todos/fetchTodos";

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
      screen.getByText("最初の 1 件は次のタスクで追加できるようにします。"),
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
});
