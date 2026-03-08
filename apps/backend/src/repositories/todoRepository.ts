import type { Todo } from "../shared/todo";

export type TodoRepository = {
  create: (todo: Todo) => Promise<Todo>;
};
