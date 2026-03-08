import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import "./App.css";
import {
  createTodo,
  TodoSaveError,
  type TodoSaveIssue,
} from "./features/todos/createTodo";
import {
  deleteTodo as deleteTodoRequestDefault,
  TodoDeleteError,
} from "./features/todos/deleteTodo";
import {
  fetchTodos,
  TodoListLoadError,
  type TodoSummary,
} from "./features/todos/fetchTodos";
import {
  TodoCompletionUpdateError,
  updateTodoCompletion,
} from "./features/todos/updateTodoCompletion";

type AppProps = {
  deleteTodo?: (id: string) => Promise<string>;
  loadTodos?: () => Promise<TodoSummary[]>;
  saveTodo?: (title: string) => Promise<TodoSummary>;
  updateTodoCompletion?: (
    id: string,
    isCompleted: boolean,
  ) => Promise<TodoSummary>;
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

type TodoCompletionState =
  | {
      status: "idle";
    }
  | {
      status: "saving";
    }
  | {
      status: "error";
      message: string;
      requestId?: string;
    };

type TodoDeleteState =
  | {
      status: "idle";
    }
  | {
      status: "deleting";
    }
  | {
      status: "error";
      message: string;
      requestId?: string;
    };

type TodoDeleteDialogState =
  | {
      status: "closed";
    }
  | {
      deleteState: TodoDeleteState;
      status: "open";
      todo: TodoSummary;
    };

export function App({
  deleteTodo = deleteTodoRequestDefault,
  loadTodos = fetchTodos,
  saveTodo = createTodo,
  updateTodoCompletion: updateTodoCompletionRequest = updateTodoCompletion,
}: AppProps) {
  const [todoListState, setTodoListState] = useState<TodoListState>({
    status: "loading",
  });
  const [todoTitleInput, setTodoTitleInput] = useState("");
  const [todoSaveState, setTodoSaveState] = useState<TodoSaveState>({
    status: "idle",
  });
  const [todoDeleteDialogState, setTodoDeleteDialogState] =
    useState<TodoDeleteDialogState>({
      status: "closed",
    });
  const [todoCompletionStates, setTodoCompletionStates] = useState<
    Record<string, TodoCompletionState>
  >({});

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

  function handleTodoCompletionToggle(todo: TodoSummary) {
    if (todoListState.status !== "success") {
      return;
    }

    const currentCompletionState = getTodoCompletionState(
      todoCompletionStates,
      todo.id,
    );

    if (currentCompletionState.status === "saving") {
      return;
    }

    setTodoCompletionStates((currentStates) => ({
      ...currentStates,
      [todo.id]: {
        status: "saving",
      },
    }));

    void updateTodoCompletionRequest(todo.id, !todo.isCompleted)
      .then((updatedTodo) => {
        setTodoListState((currentState) => {
          if (currentState.status !== "success") {
            return currentState;
          }

          return {
            status: "success",
            todos: currentState.todos.map((currentTodo) =>
              currentTodo.id === updatedTodo.id ? updatedTodo : currentTodo,
            ),
          };
        });
        setTodoCompletionStates((currentStates) => ({
          ...currentStates,
          [todo.id]: {
            status: "idle",
          },
        }));
      })
      .catch((error: unknown) => {
        if (error instanceof TodoCompletionUpdateError) {
          setTodoCompletionStates((currentStates) => ({
            ...currentStates,
            [todo.id]: {
              message: error.message,
              requestId: error.requestId,
              status: "error",
            },
          }));

          return;
        }

        setTodoCompletionStates((currentStates) => ({
          ...currentStates,
          [todo.id]: {
            message: "Todo の更新に失敗しました。",
            status: "error",
          },
        }));
      });
  }

  function handleTodoDeleteDialogOpen(todo: TodoSummary) {
    setTodoDeleteDialogState({
      deleteState: {
        status: "idle",
      },
      status: "open",
      todo,
    });
  }

  function handleTodoDeleteDialogClose() {
    if (
      todoDeleteDialogState.status === "open" &&
      todoDeleteDialogState.deleteState.status === "deleting"
    ) {
      return;
    }

    setTodoDeleteDialogState({
      status: "closed",
    });
  }

  function handleTodoDeleteConfirm() {
    if (
      todoDeleteDialogState.status !== "open" ||
      todoListState.status !== "success" ||
      todoDeleteDialogState.deleteState.status === "deleting"
    ) {
      return;
    }

    const deleteTargetTodo = todoDeleteDialogState.todo;

    setTodoDeleteDialogState({
      deleteState: {
        status: "deleting",
      },
      status: "open",
      todo: deleteTargetTodo,
    });

    void deleteTodo(deleteTargetTodo.id)
      .then((deletedTodoId) => {
        setTodoListState((currentState) => {
          if (currentState.status !== "success") {
            return currentState;
          }

          return {
            status: "success",
            todos: currentState.todos.filter((todo) => todo.id !== deletedTodoId),
          };
        });
        setTodoCompletionStates((currentStates) =>
          omitTodoState(currentStates, deleteTargetTodo.id),
        );
        setTodoDeleteDialogState({
          status: "closed",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof TodoDeleteError) {
          setTodoDeleteDialogState({
            deleteState: {
              message: error.message,
              requestId: error.requestId,
              status: "error",
            },
            status: "open",
            todo: deleteTargetTodo,
          });

          return;
        }

        setTodoDeleteDialogState({
          deleteState: {
            message: "Todo の削除に失敗しました。",
            status: "error",
          },
          status: "open",
          todo: deleteTargetTodo,
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
              {todoListState.todos.map((todo) => {
                const todoCompletionState = getTodoCompletionState(
                  todoCompletionStates,
                  todo.id,
                );

                return (
                <li
                  className="todo-card"
                  data-completed={todo.isCompleted ? "true" : "false"}
                  key={todo.id}
                >
                  <div className="todo-card-topline">
                    <p className="todo-status">
                      {todo.isCompleted ? "完了" : "未完了"}
                    </p>
                    <p className="todo-date">
                      {formatTodoDate(todo.createdAt)}
                    </p>
                  </div>
                  <h2>{todo.title}</h2>
                  <div className="todo-card-actions">
                    <button
                      className="todo-toggle-button"
                      disabled={todoCompletionState.status === "saving"}
                      onClick={() => handleTodoCompletionToggle(todo)}
                      type="button"
                    >
                      {todoCompletionState.status === "saving"
                        ? "更新中..."
                        : todo.isCompleted
                          ? "未完了に戻す"
                          : "完了にする"}
                    </button>
                    <button
                      className="todo-delete-button"
                      onClick={() => handleTodoDeleteDialogOpen(todo)}
                      type="button"
                    >
                      削除する
                    </button>
                  </div>
                  {todoCompletionState.status === "error" ? (
                    <div className="todo-inline-error" role="alert">
                      <p>{todoCompletionState.message}</p>
                      {todoCompletionState.requestId ? (
                        <p className="request-id">
                          requestId: {todoCompletionState.requestId}
                        </p>
                      ) : null}
                      <p>更新に失敗したため、この Todo の表示は切り替えていません。</p>
                    </div>
                  ) : null}
                </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </section>
      {todoDeleteDialogState.status === "open" ? (
        <div className="dialog-backdrop">
          <section
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
            className="confirm-dialog"
            role="dialog"
          >
            <p className="status-label">Delete Todo</p>
            <h2 id="delete-dialog-title">Todo を削除しますか？</h2>
            <p className="dialog-target-title">{todoDeleteDialogState.todo.title}</p>
            <p className="dialog-copy">
              削除は 1 件ずつ確認して実行します。成功したときだけ一覧から外します。
            </p>
            {todoDeleteDialogState.deleteState.status === "error" ? (
              <div className="status-card dialog-error-card" role="alert">
                <p>{todoDeleteDialogState.deleteState.message}</p>
                {todoDeleteDialogState.deleteState.requestId ? (
                  <p className="request-id">
                    requestId: {todoDeleteDialogState.deleteState.requestId}
                  </p>
                ) : null}
                <p>削除に失敗したため、この Todo は一覧に残しています。</p>
              </div>
            ) : null}
            <div className="dialog-actions">
              <button
                className="dialog-cancel-button"
                disabled={todoDeleteDialogState.deleteState.status === "deleting"}
                onClick={handleTodoDeleteDialogClose}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="dialog-confirm-button"
                disabled={todoDeleteDialogState.deleteState.status === "deleting"}
                onClick={handleTodoDeleteConfirm}
                type="button"
              >
                {todoDeleteDialogState.deleteState.status === "deleting"
                  ? "削除中..."
                  : "削除を確定する"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
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

function getTodoCompletionState(
  todoCompletionStates: Record<string, TodoCompletionState>,
  todoId: string,
): TodoCompletionState {
  return todoCompletionStates[todoId] ?? {
    status: "idle",
  };
}

function omitTodoState<T>(todoStates: Record<string, T>, todoId: string) {
  const { [todoId]: _removedTodoState, ...remainingTodoStates } = todoStates;

  return remainingTodoStates;
}
