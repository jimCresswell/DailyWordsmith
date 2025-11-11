import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, notInArray } from "drizzle-orm";
import {
  type CuratedWord,
  type InsertCuratedWord,
  type WordDefinition,
  type InsertWordDefinition,
  type MissingDefinition,
  type InsertMissingDefinition,
  type Word,
  curatedWords,
  wordDefinitions,
  missingDefinitions,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

export interface IStorage {
  // Curated words operations
  getCuratedWord(id: string): Promise<CuratedWord | undefined>;
  getCuratedWordByText(word: string): Promise<CuratedWord | undefined>;
  getAllCuratedWords(): Promise<CuratedWord[]>;
  getRandomCuratedWord(): Promise<CuratedWord | undefined>;
  getRandomEligibleWord(): Promise<CuratedWord | undefined>;
  
  // Word definitions operations
  getDefinition(wordId: string): Promise<WordDefinition | undefined>;
  createDefinition(definition: InsertWordDefinition): Promise<WordDefinition>;
  updateDefinition(id: string, definition: Partial<InsertWordDefinition>): Promise<WordDefinition | undefined>;
  upsertDefinition(wordId: string, definition: Omit<InsertWordDefinition, 'wordId'>): Promise<WordDefinition>;
  isDefinitionStale(definition: WordDefinition): boolean;
  
  // Missing definitions operations
  getMissingDefinition(wordId: string): Promise<MissingDefinition | undefined>;
  markWordAsMissing(wordId: string, reason: string): Promise<MissingDefinition>;
  getAllMissingDefinitionIds(): Promise<string[]>;
  
  // Combined operations
  getWordWithDefinition(wordId: string): Promise<Word | undefined>;
  getRandomWordWithDefinition(): Promise<Word | undefined>;
}

export class PostgresStorage implements IStorage {
  // Curated words operations
  async getCuratedWord(id: string): Promise<CuratedWord | undefined> {
    const [word] = await db
      .select()
      .from(curatedWords)
      .where(eq(curatedWords.id, id))
      .limit(1);
    return word;
  }

  async getCuratedWordByText(word: string): Promise<CuratedWord | undefined> {
    const [result] = await db
      .select()
      .from(curatedWords)
      .where(sql`LOWER(${curatedWords.word}) = LOWER(${word})`)
      .limit(1);
    return result;
  }

  async getAllCuratedWords(): Promise<CuratedWord[]> {
    return await db.select().from(curatedWords);
  }

  async getRandomCuratedWord(): Promise<CuratedWord | undefined> {
    const [word] = await db
      .select()
      .from(curatedWords)
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return word;
  }

  async getRandomEligibleWord(): Promise<CuratedWord | undefined> {
    // Get all missing word IDs
    const missingIds = await this.getAllMissingDefinitionIds();
    
    if (missingIds.length === 0) {
      // No missing words, select any random word
      return this.getRandomCuratedWord();
    }
    
    // Select random word that's NOT in missing definitions
    const [word] = await db
      .select()
      .from(curatedWords)
      .where(notInArray(curatedWords.id, missingIds))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return word;
  }

  // Word definitions operations
  async getDefinition(wordId: string): Promise<WordDefinition | undefined> {
    const [definition] = await db
      .select()
      .from(wordDefinitions)
      .where(eq(wordDefinitions.wordId, wordId))
      .limit(1);
    return definition;
  }

  async createDefinition(insertDef: InsertWordDefinition): Promise<WordDefinition> {
    const [definition] = await db
      .insert(wordDefinitions)
      .values(insertDef)
      .returning();
    return definition;
  }

  async updateDefinition(
    id: string,
    updates: Partial<InsertWordDefinition>
  ): Promise<WordDefinition | undefined> {
    const [updated] = await db
      .update(wordDefinitions)
      .set({ ...updates, fetchedAt: new Date() })
      .where(eq(wordDefinitions.id, id))
      .returning();
    return updated;
  }

  async upsertDefinition(
    wordId: string,
    defData: Omit<InsertWordDefinition, 'wordId'>
  ): Promise<WordDefinition> {
    // Check if definition exists
    const existing = await this.getDefinition(wordId);
    
    if (existing) {
      // Update existing definition with fresh data
      const [updated] = await db
        .update(wordDefinitions)
        .set({ ...defData, fetchedAt: new Date() })
        .where(eq(wordDefinitions.wordId, wordId))
        .returning();
      return updated;
    } else {
      // Create new definition
      return await this.createDefinition({ wordId, ...defData });
    }
  }

  isDefinitionStale(definition: WordDefinition): boolean {
    const now = new Date().getTime();
    const fetchedAt = new Date(definition.fetchedAt).getTime();
    return now - fetchedAt > NINETY_DAYS_MS;
  }

  // Missing definitions operations
  async getMissingDefinition(wordId: string): Promise<MissingDefinition | undefined> {
    const [missing] = await db
      .select()
      .from(missingDefinitions)
      .where(eq(missingDefinitions.wordId, wordId))
      .limit(1);
    return missing;
  }

  async markWordAsMissing(wordId: string, reason: string): Promise<MissingDefinition> {
    // Check if already marked as missing
    const existing = await this.getMissingDefinition(wordId);
    if (existing) {
      return existing;
    }

    // Insert new missing definition record
    const [missing] = await db
      .insert(missingDefinitions)
      .values({ wordId, reason })
      .onConflictDoNothing() // Handle race conditions
      .returning();
    
    // If onConflictDoNothing triggered, fetch the existing record
    if (!missing) {
      const existing = await this.getMissingDefinition(wordId);
      if (existing) return existing;
      throw new Error('Failed to mark word as missing');
    }
    
    return missing;
  }

  async getAllMissingDefinitionIds(): Promise<string[]> {
    const results = await db
      .select({ wordId: missingDefinitions.wordId })
      .from(missingDefinitions);
    return results.map(r => r.wordId);
  }

  // Combined operations
  async getWordWithDefinition(wordId: string): Promise<Word | undefined> {
    const word = await this.getCuratedWord(wordId);
    if (!word) return undefined;

    const definition = await this.getDefinition(wordId);
    if (!definition) return undefined;

    return {
      id: word.id,
      word: word.word,
      difficulty: word.difficulty,
      pronunciation: definition.pronunciation,
      partOfSpeech: definition.partOfSpeech,
      definition: definition.definition,
      etymology: definition.etymology,
      examples: definition.examples,
    };
  }

  async getRandomWordWithDefinition(): Promise<Word | undefined> {
    const word = await this.getRandomCuratedWord();
    if (!word) return undefined;

    return await this.getWordWithDefinition(word.id);
  }
}

export const storage = new PostgresStorage();
