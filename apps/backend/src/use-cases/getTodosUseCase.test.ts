import type { Todo } from "../shared/todo";
import { getTodosUseCase } from "./getTodosUseCase";

describe("getTodosUseCase", () => {
  it("repository が返した Todo 一覧をそのまま返す", async () => {
    const todos: Todo[] = [
      {
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        id: "todo-2",
        isCompleted: false,
        title: "二番目の Todo",
        updatedAt: new Date("2026-03-08T00:00:00.000Z"),
      },
      {
        createdAt: new Date("2026-03-07T00:00:00.000Z"),
        id: "todo-1",
        isCompleted: false,
        title: "最初の Todo",
        updatedAt: new Date("2026-03-07T00:00:00.000Z"),
      },
    ];
    const useCase = getTodosUseCase({
      todoRepository: {
        async create(todo) {
          return todo;
        },
        async list() {
          return todos;
        },
      },
    });

    await expect(useCase.execute()).resolves.toEqual(todos);
  });
});
