import type { Todo } from "../shared/todo";
import type { TodoRepository } from "../repositories/todoRepository";

export type GetTodosUseCase = {
  execute: () => Promise<Todo[]>;
};

export type GetTodosUseCaseDependencies = {
  todoRepository: TodoRepository;
};

export function getTodosUseCase(
  dependencies: GetTodosUseCaseDependencies,
): GetTodosUseCase {
  return {
    async execute() {
      return dependencies.todoRepository.list();
    },
  };
}
