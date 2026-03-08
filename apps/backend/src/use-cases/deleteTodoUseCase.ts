import { ResourceNotFoundError } from "../shared/requestError";
import type { TodoRepository } from "../repositories/todoRepository";

export type DeleteTodoUseCase = {
  execute: (input: { id: string }) => Promise<void>;
};

export type DeleteTodoUseCaseDependencies = {
  todoRepository: Pick<TodoRepository, "deleteById">;
};

export function deleteTodoUseCase(
  dependencies: DeleteTodoUseCaseDependencies,
): DeleteTodoUseCase {
  return {
    async execute(input) {
      const didDeleteTodo = await dependencies.todoRepository.deleteById(input.id);

      if (!didDeleteTodo) {
        throw new ResourceNotFoundError("Todo が見つかりません。");
      }
    },
  };
}
