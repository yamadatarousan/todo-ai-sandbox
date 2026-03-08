import { useEffect, useState } from "react";
import "./App.css";
import {
  fetchTodos,
  TodoListLoadError,
  type TodoSummary,
} from "./features/todos/fetchTodos";

type AppProps = {
  loadTodos?: () => Promise<TodoSummary[]>;
};

type AppState =
  | {
      status: "loading";
    }
  | {
      status: "error";
      message: string;
      requestId?: string;
    }
  | {
      status: "success";
      todos: TodoSummary[];
    };

export function App({ loadTodos = fetchTodos }: AppProps) {
  const [state, setState] = useState<AppState>({
    status: "loading",
  });

  useEffect(() => {
    let isCancelled = false;

    setState({
      status: "loading",
    });

    void loadTodos()
      .then((todos) => {
        if (isCancelled) {
          return;
        }

        setState({
          status: "success",
          todos,
        });
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        if (error instanceof TodoListLoadError) {
          setState({
            message: error.message,
            requestId: error.requestId,
            status: "error",
          });

          return;
        }

        setState({
          message: "Todo 一覧の取得に失敗しました。",
          status: "error",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [loadTodos]);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Failure Detection Sandbox</p>
        <h1>Todo AI Sandbox</h1>
        <p className="hero-copy">
          一覧取得の成功と失敗を、静かに見逃さないための最初の画面です。
        </p>
      </section>
      <section aria-live="polite" className="board-panel">
        {state.status === "loading" ? (
          <div className="status-card" data-state="loading">
            <p className="status-label">Loading</p>
            <p>Todo を読み込んでいます。</p>
          </div>
        ) : null}
        {state.status === "error" ? (
          <div className="status-card" data-state="error" role="alert">
            <p className="status-label">Fetch Failed</p>
            <p>{state.message}</p>
            {state.requestId ? (
              <p className="request-id">requestId: {state.requestId}</p>
            ) : null}
            <p>成功したようには扱わず、失敗として表示しています。</p>
          </div>
        ) : null}
        {state.status === "success" && state.todos.length === 0 ? (
          <div className="status-card" data-state="empty">
            <p className="status-label">Empty</p>
            <p>Todo はまだありません。</p>
            <p>最初の 1 件は次のタスクで追加できるようにします。</p>
          </div>
        ) : null}
        {state.status === "success" && state.todos.length > 0 ? (
          <section className="todo-list-panel">
            <header className="todo-list-header">
              <p className="status-label">Loaded</p>
              <p>{state.todos.length} 件の Todo を表示しています。</p>
            </header>
            <ol className="todo-list">
              {state.todos.map((todo) => (
                <li className="todo-card" key={todo.id}>
                  <div className="todo-card-topline">
                    <p className="todo-status">
                      {todo.isCompleted ? "完了" : "未完了"}
                    </p>
                    <p className="todo-date">
                      {formatTodoDate(todo.createdAt)}
                    </p>
                  </div>
                  <h2>{todo.title}</h2>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function formatTodoDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}
