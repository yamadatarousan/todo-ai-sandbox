import { ClientInputError } from "../shared/requestError";
import type { Todo } from "../shared/todo";
import { createTodoUseCase } from "./createTodoUseCase";

describe("createTodoUseCase", () => {
  it("title を trim して Todo を作成する", async () => {
    const fixedDate = new Date("2026-03-08T00:00:00.000Z");
    let savedTodo: Todo | undefined;
    const useCase = createTodoUseCase({
      createId() {
        return "todo-1";
      },
      getCurrentDate() {
        return fixedDate;
      },
      todoRepository: {
        async create(todo) {
          savedTodo = todo;
          return todo;
        },
        async list() {
          return [];
        },
      },
    });

    const createdTodo = await useCase.execute({
      title: "  最初の Todo  ",
    });

    expect(savedTodo).toEqual({
      createdAt: fixedDate,
      id: "todo-1",
      isCompleted: false,
      title: "最初の Todo",
      updatedAt: fixedDate,
    });
    expect(createdTodo).toEqual(savedTodo);
  });

  it("空白だけの title を拒否する", async () => {
    const createSpy = vi.fn();
    const useCase = createTodoUseCase({
      todoRepository: {
        async create(todo) {
          createSpy(todo);
          return todo;
        },
        async list() {
          return [];
        },
      },
    });

    await expect(
      useCase.execute({
        title: "   ",
      }),
    ).rejects.toBeInstanceOf(ClientInputError);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
