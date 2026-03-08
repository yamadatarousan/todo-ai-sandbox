import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import "./App.css";
import {
  createTodo,
  TodoSaveError,
  type TodoSaveIssue,
} from "./features/todos/createTodo";
import {
  fetchTodos,
  TodoListLoadError,
  type TodoSummary,
} from "./features/todos/fetchTodos";

type AppProps = {
  loadTodos?: () => Promise<TodoSummary[]>;
  saveTodo?: (title: string) => Promise<TodoSummary>;
};

type TodoListState =
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

type TodoSaveState =
  | {
      status: "idle";
    }
  | {
      status: "saving";
    }
  | {
      status: "error";
      issues: TodoSaveIssue[];
      message: string;
      requestId?: string;
    };

export function App({
  loadTodos = fetchTodos,
  saveTodo = createTodo,
}: AppProps) {
  const [todoListState, setTodoListState] = useState<TodoListState>({
    status: "loading",
  });
  const [todoTitleInput, setTodoTitleInput] = useState("");
  const [todoSaveState, setTodoSaveState] = useState<TodoSaveState>({
    status: "idle",
  });

  useEffect(() => {
    let isCancelled = false;

    setTodoListState({
      status: "loading",
    });

    void loadTodos()
      .then((todos) => {
        if (isCancelled) {
          return;
        }

        setTodoListState({
          status: "success",
          todos,
        });
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        if (error instanceof TodoListLoadError) {
          setTodoListState({
            message: error.message,
            requestId: error.requestId,
            status: "error",
          });

          return;
        }

        setTodoListState({
          message: "Todo 一覧の取得に失敗しました。",
          status: "error",
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [loadTodos]);

  function handleTodoTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setTodoTitleInput(event.currentTarget.value);

    if (todoSaveState.status === "error") {
      setTodoSaveState({
        status: "idle",
      });
    }
  }

  function handleTodoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      todoListState.status !== "success" ||
      todoSaveState.status === "saving"
    ) {
      return;
    }

    setTodoSaveState({
      status: "saving",
    });

    void saveTodo(todoTitleInput)
      .then((createdTodo) => {
        setTodoListState((currentState) => {
          if (currentState.status !== "success") {
            return currentState;
          }

          return {
            status: "success",
            todos: [createdTodo, ...currentState.todos],
          };
        });
        setTodoTitleInput("");
        setTodoSaveState({
          status: "idle",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof TodoSaveError) {
          setTodoSaveState({
            issues: error.issues,
            message: error.message,
            requestId: error.requestId,
            status: "error",
          });

          return;
        }

        setTodoSaveState({
          issues: [],
          message: "Todo の保存に失敗しました。",
          status: "error",
        });
      });
  }

  const isTodoSubmitDisabled =
    todoListState.status !== "success" || todoSaveState.status === "saving";

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Failure Detection Sandbox</p>
        <h1>Todo AI Sandbox</h1>
        <p className="hero-copy">
          一覧取得と保存失敗を、静かに見逃さないための最初の画面です。
        </p>
      </section>
      <section aria-live="polite" className="board-panel">
        <section className="composer-panel">
          <header className="composer-header">
            <p className="status-label">Add Todo</p>
            <p>保存失敗はフォーム周辺に閉じ込めます。</p>
          </header>
          <form className="todo-form" onSubmit={handleTodoSubmit}>
            <label className="todo-form-label" htmlFor="todo-title-input">
              新しい Todo
            </label>
            <div className="todo-form-row">
              <input
                autoComplete="off"
                className="todo-title-input"
                id="todo-title-input"
                name="title"
                onChange={handleTodoTitleChange}
                placeholder="例: 保存失敗を見逃さない"
                value={todoTitleInput}
              />
              <button disabled={isTodoSubmitDisabled} type="submit">
                {todoSaveState.status === "saving" ? "保存中..." : "Todo を追加する"}
              </button>
            </div>
          </form>
          <p className="form-hint">
            {todoListState.status === "success"
              ? "入力不正や想定外エラーも、成功したようには扱いません。"
              : "一覧取得が終わるまで追加は止めています。"}
          </p>
          {todoSaveState.status === "error" ? (
            <div className="status-card form-error-card" role="alert">
              <p className="status-label">Save Failed</p>
              <p>{todoSaveState.message}</p>
              {todoSaveState.issues.length > 0 ? (
                <ul className="issue-list">
                  {todoSaveState.issues.map((issue) => (
                    <li key={`${issue.field}:${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              ) : null}
              {todoSaveState.requestId ? (
                <p className="request-id">requestId: {todoSaveState.requestId}</p>
              ) : null}
              <p>保存に失敗したため、一覧は成功扱いに更新していません。</p>
            </div>
          ) : null}
        </section>

        {todoListState.status === "loading" ? (
          <div className="status-card" data-state="loading">
            <p className="status-label">Loading</p>
            <p>Todo を読み込んでいます。</p>
          </div>
        ) : null}
        {todoListState.status === "error" ? (
          <div className="status-card" data-state="error" role="alert">
            <p className="status-label">Fetch Failed</p>
            <p>{todoListState.message}</p>
            {todoListState.requestId ? (
              <p className="request-id">requestId: {todoListState.requestId}</p>
            ) : null}
            <p>成功したようには扱わず、失敗として表示しています。</p>
          </div>
        ) : null}
        {todoListState.status === "success" && todoListState.todos.length === 0 ? (
          <div className="status-card" data-state="empty">
            <p className="status-label">Empty</p>
            <p>Todo はまだありません。</p>
            <p>最初の 1 件を追加して、保存結果をここで確認できます。</p>
          </div>
        ) : null}
        {todoListState.status === "success" && todoListState.todos.length > 0 ? (
          <section className="todo-list-panel">
            <header className="todo-list-header">
              <p className="status-label">Loaded</p>
              <p>{todoListState.todos.length} 件の Todo を表示しています。</p>
            </header>
            <ol className="todo-list">
              {todoListState.todos.map((todo) => (
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
