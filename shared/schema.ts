import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Curated list of advanced vocabulary words
export const curatedWords = pgTable("curated_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: text("word").notNull().unique(),
  difficulty: integer("difficulty").notNull(), // 1-10 scale
});

// Cached word definitions from Dictionary API with 90-day TTL
export const wordDefinitions = pgTable("word_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wordId: varchar("word_id")
    .notNull()
    .unique() // Ensure only one definition per word
    .references(() => curatedWords.id, { onDelete: "cascade" }),
  pronunciation: text("pronunciation"),
  partOfSpeech: text("part_of_speech"),
  definition: text("definition").notNull(),
  etymology: text("etymology"),
  examples: text("examples").array(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

// Insert schemas
export const insertCuratedWordSchema = createInsertSchema(curatedWords).omit({
  id: true,
});

export const insertWordDefinitionSchema = createInsertSchema(wordDefinitions).omit({
  id: true,
  fetchedAt: true,
});

// Types
export type CuratedWord = typeof curatedWords.$inferSelect;
export type InsertCuratedWord = z.infer<typeof insertCuratedWordSchema>;

export type WordDefinition = typeof wordDefinitions.$inferSelect;
export type InsertWordDefinition = z.infer<typeof insertWordDefinitionSchema>;

// Combined type for frontend consumption
export type Word = {
  id: string;
  word: string;
  difficulty: number;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  definition: string;
  etymology?: string | null;
  examples?: string[] | null;
};
