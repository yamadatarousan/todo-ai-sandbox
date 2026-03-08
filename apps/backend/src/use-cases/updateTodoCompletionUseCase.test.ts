import { ResourceNotFoundError } from "../shared/requestError";
import type { Todo } from "../shared/todo";
import { updateTodoCompletionUseCase } from "./updateTodoCompletionUseCase";

describe("updateTodoCompletionUseCase", () => {
  it("Todo の完了状態を更新する", async () => {
    const fixedDate = new Date("2026-03-10T00:00:00.000Z");
    const originalTodo: Todo = {
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      id: "todo-1",
      isCompleted: false,
      title: "最初の Todo",
      updatedAt: new Date("2026-03-08T00:00:00.000Z"),
    };
    const updateCompletionSpy = vi.fn().mockResolvedValue({
      ...originalTodo,
      isCompleted: true,
      updatedAt: fixedDate,
    });
    const useCase = updateTodoCompletionUseCase({
      getCurrentDate() {
        return fixedDate;
      },
      todoRepository: {
        updateCompletion: updateCompletionSpy,
      },
    });

    await expect(
      useCase.execute({
        id: "todo-1",
        isCompleted: true,
      }),
    ).resolves.toEqual({
      ...originalTodo,
      isCompleted: true,
      updatedAt: fixedDate,
    });
    expect(updateCompletionSpy).toHaveBeenCalledWith({
      id: "todo-1",
      isCompleted: true,
      updatedAt: fixedDate,
    });
  });

  it("存在しない Todo は ResourceNotFoundError を返す", async () => {
    const useCase = updateTodoCompletionUseCase({
      todoRepository: {
        async updateCompletion() {
          return undefined;
        },
      },
    });

    await expect(
      useCase.execute({
        id: "missing-todo",
        isCompleted: true,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
