import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todoTitleMaxLength = 200;

export const todos = sqliteTable(
  "todos",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    isCompleted: integer("is_completed", { mode: "boolean" })
      .notNull()
      .default(false),
    title: text("title").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check("todo_title_not_empty", sql`length(trim(${table.title})) > 0`),
    check(
      "todo_title_within_max_length",
      sql`length(${table.title}) <= ${todoTitleMaxLength}`,
    ),
    check(
      "todo_is_completed_boolean",
      sql`${table.isCompleted} IN (0, 1)`,
    ),
  ],
);
