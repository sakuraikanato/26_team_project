// apps/api/src/db/schema/comments.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { posts } from "./posts.js";

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("あなた"),
  text: text("text").notNull(),
  createdAt: text("created_at").notNull(),
});