import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const words = pgTable("words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: text("word").notNull(),
  pronunciation: text("pronunciation"),
  partOfSpeech: text("part_of_speech"),
  definition: text("definition").notNull(),
  etymology: text("etymology"),
  examples: text("examples").array(),
  difficulty: integer("difficulty").notNull(),
  dateAdded: timestamp("date_added").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  wordId: varchar("word_id").references(() => words.id),
  learned: integer("learned").default(0),
  dateViewed: timestamp("date_viewed").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertWordSchema = createInsertSchema(words).omit({
  id: true,
  dateAdded: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  dateViewed: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Word = typeof words.$inferSelect;
export type InsertWord = z.infer<typeof insertWordSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
