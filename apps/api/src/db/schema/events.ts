import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema.js";

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keeperId: integer("keeper_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: text("created_at").notNull(),
});
