import {
  ResourceNotFoundError,
} from "../shared/requestError";
import type { Todo } from "../shared/todo";
import type { TodoRepository } from "../repositories/todoRepository";

export type UpdateTodoCompletionInput = {
  id: string;
  isCompleted: boolean;
};

export type UpdateTodoCompletionUseCase = {
  execute: (input: UpdateTodoCompletionInput) => Promise<Todo>;
};

export type UpdateTodoCompletionUseCaseDependencies = {
  getCurrentDate?: () => Date;
  todoRepository: Pick<TodoRepository, "updateCompletion">;
};

export function updateTodoCompletionUseCase(
  dependencies: UpdateTodoCompletionUseCaseDependencies,
): UpdateTodoCompletionUseCase {
  return {
    async execute(input) {
      const updatedTodo = await dependencies.todoRepository.updateCompletion({
        id: input.id,
        isCompleted: input.isCompleted,
        updatedAt: dependencies.getCurrentDate?.() ?? new Date(),
      });

      if (!updatedTodo) {
        throw new ResourceNotFoundError("Todo が見つかりません。");
      }

      return updatedTodo;
    },
  };
}
