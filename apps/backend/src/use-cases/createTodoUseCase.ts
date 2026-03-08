import { randomUUID } from "node:crypto";
import { todoTitleMaxLength } from "../database/schema";
import { ClientInputError } from "../shared/requestError";
import type { Todo } from "../shared/todo";
import type { TodoRepository } from "../repositories/todoRepository";

export type CreateTodoInput = {
  title: string;
};

export type CreateTodoUseCase = {
  execute: (input: CreateTodoInput) => Promise<Todo>;
};

export type CreateTodoUseCaseDependencies = {
  createId?: () => string;
  getCurrentDate?: () => Date;
  todoRepository: Pick<TodoRepository, "create">;
};

export function createTodoUseCase(
  dependencies: CreateTodoUseCaseDependencies,
): CreateTodoUseCase {
  return {
    async execute(input) {
      const normalizedTitle = input.title.trim();
      const issues = [];

      if (normalizedTitle.length === 0) {
        issues.push({
          field: "title",
          message: "title は空文字を許可しません。",
        });
      }

      if (normalizedTitle.length > todoTitleMaxLength) {
        issues.push({
          field: "title",
          message: `title は ${todoTitleMaxLength} 文字以下である必要があります。`,
        });
      }

      if (issues.length > 0) {
        throw new ClientInputError("入力が不正です。", { issues });
      }

      const currentDate =
        dependencies.getCurrentDate?.() ?? new Date();
      const todo = {
        createdAt: currentDate,
        id: dependencies.createId?.() ?? randomUUID(),
        isCompleted: false,
        title: normalizedTitle,
        updatedAt: currentDate,
      };

      return dependencies.todoRepository.create(todo);
    },
  };
}
