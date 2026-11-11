// apps/api/src/db/schema/posts.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema.js";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  keeperId: integer("keeper_id").references(() => user.id),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),

  mood: text("mood", { enum: ["kiritto", "mattari"] }).notNull().default("kiritto"),
  takenAt: text("taken_at").notNull(), // "YYYY-MM-DD"

  weather: text("weather"), // "sunny" | "rainy" | "cloudy" | "snowy"
  temperature: integer("temperature"),
  likeCount: integer("like_count").notNull().default(0),

  createdAt: text("created_at").notNull(),
});