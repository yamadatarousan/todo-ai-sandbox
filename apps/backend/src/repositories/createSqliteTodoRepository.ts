import { desc, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as databaseSchema from "../database/schema";
import { todos } from "../database/schema";
import type { Todo } from "../shared/todo";
import type { TodoRepository } from "./todoRepository";

export type CreateSqliteTodoRepositoryOptions = {
  database: BetterSQLite3Database<typeof databaseSchema>;
};

export function createSqliteTodoRepository(
  options: CreateSqliteTodoRepositoryOptions,
): TodoRepository {
  return {
    async create(todo: Todo) {
      options.database.insert(todos).values(todo).run();

      return todo;
    },
    async deleteById(id) {
      const deletedResult = options.database
        .delete(todos)
        .where(eq(todos.id, id))
        .run();

      return deletedResult.changes > 0;
    },
    async list() {
      return options.database
        .select()
        .from(todos)
        .orderBy(desc(todos.createdAt), desc(todos.id))
        .all();
    },
    async updateCompletion(input) {
      const currentTodo = options.database
        .select()
        .from(todos)
        .where(eq(todos.id, input.id))
        .get();

      if (!currentTodo) {
        return undefined;
      }

      if (currentTodo.isCompleted === input.isCompleted) {
        return currentTodo;
      }

      options.database
        .update(todos)
        .set({
          isCompleted: input.isCompleted,
          updatedAt: input.updatedAt,
        })
        .where(eq(todos.id, input.id))
        .run();

      return options.database
        .select()
        .from(todos)
        .where(eq(todos.id, input.id))
        .get();
    },
  };
}
