import { betterAuth, generateId } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../src/db/index.js"; // your drizzle instance

export const auth = betterAuth({
  database: drizzleAdapter(db, {
      provider: "sqlite", // or "mysql", "sqlite"
  }),
  advanced: {
    database: {
      generateId: "serial"
    }
  }
});