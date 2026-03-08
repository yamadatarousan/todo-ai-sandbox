import { ResourceNotFoundError } from "../shared/requestError";
import { deleteTodoUseCase } from "./deleteTodoUseCase";

describe("deleteTodoUseCase", () => {
  it("Todo を 1 件削除する", async () => {
    const deleteByIdSpy = vi.fn().mockResolvedValue(true);
    const useCase = deleteTodoUseCase({
      todoRepository: {
        deleteById: deleteByIdSpy,
      },
    });

    await expect(
      useCase.execute({
        id: "todo-1",
      }),
    ).resolves.toBeUndefined();
    expect(deleteByIdSpy).toHaveBeenCalledWith("todo-1");
  });

  it("存在しない Todo は ResourceNotFoundError を返す", async () => {
    const useCase = deleteTodoUseCase({
      todoRepository: {
        async deleteById() {
          return false;
        },
      },
    });

    await expect(
      useCase.execute({
        id: "missing-todo",
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
