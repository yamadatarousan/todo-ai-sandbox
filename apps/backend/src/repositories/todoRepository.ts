import type { Todo } from "../shared/todo";

export type UpdateTodoCompletionRepositoryInput = {
  id: string;
  isCompleted: boolean;
  updatedAt: Date;
};

export type TodoRepository = {
  create: (todo: Todo) => Promise<Todo>;
  list: () => Promise<Todo[]>;
  updateCompletion: (
    input: UpdateTodoCompletionRepositoryInput,
  ) => Promise<Todo | undefined>;
};
