import { desc } from "drizzle-orm";
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
    async list() {
      return options.database
        .select()
        .from(todos)
        .orderBy(desc(todos.createdAt), desc(todos.id))
        .all();
    },
  };
}
